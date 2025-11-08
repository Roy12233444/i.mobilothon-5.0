- Fix ESLint warning in Dashboard.js: Correct the condition in fetchData useCallback to use response data instead of state variables, and add proper dependencies.
- Replace DeckGL with react-leaflet in MapView.js for better compatibility and to fix the blank map issue.
- Test the application to ensure the map displays vehicles and routes correctly.



// MapView.optimized.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Popup,
  Polyline,
  CircleMarker,
  useMapEvent,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Blinking CSS + minimal marker styles
const styles = `
  .blinking { animation: blink 1s infinite; }
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  .vehicle-popup { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
`;

/**
 * Utility: stable numeric seed from string id
 */
function idSeed(id) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 10000) / 10000;
}

/**
 * Fallback position calculator for main-thread rAF loop (same logic as worker)
 */
function calcPositions(vehicles, center) {
  const t = performance.now() / 10000; // time scalar
  const [cLat, cLng] = center;
  return vehicles.map((v, i) => {
    if (v.speed && v.speed > 0) {
      const seed = idSeed(String(v.id || i));
      const radius = 0.005 * (1 + (v.speed ? Math.min(v.speed, 120) / 120 : 0)); // scale with speed
      const angle = t + seed * Math.PI * 2;
      return {
        ...v,
        lat: cLat + Math.sin(angle + seed) * radius,
        lng: cLng + Math.cos(angle + seed) * radius,
      };
    }
    return v;
  });
}

/**
 * MapView (optimized)
 *
 * Props:
 *  - vehicles: [{id, name, status, speed, fuel_level, lat?, lng?}]
 *  - optimizedRoutes: { routes: [ { stops: [[lat,lng], ...] }, ... ] }
 *  - routesVisible: boolean
 *  - onVehicleClick: function(vehicle)
 */
const MapView = ({ vehicles = [], optimizedRoutes, routesVisible, onVehicleClick }) => {
  // Map center: Bangalore
  const center = [12.9716, 77.5946];

  // Add dummy vehicles for demo if none provided
  const dummyVehicles = [
    { id: 'dummy1', name: 'Truck Extra 1', status: 'active', speed: 20, fuel_level: 80, lat: 12.98, lng: 77.6 },
    { id: 'dummy2', name: 'Van Extra 2', status: 'active', speed: 30, fuel_level: 70, lat: 12.96, lng: 77.58 },
    { id: 'dummy3', name: 'Bus Extra 3', status: 'active', speed: 15, fuel_level: 90, lat: 12.97, lng: 77.62 },
  ];

  const initialVehicles = useRef([]);
  const [animatedVehicles, setAnimatedVehicles] = useState([]);
  const workerRef = useRef(null);
  const rafRef = useRef(null);

  // Initialize vehicles (merge provided + dummy, set initial positions near Bangalore)
  useEffect(() => {
    const all = [...vehicles, ...dummyVehicles].map((v, i) => ({
      ...v,
      lat: v.lat ?? (center[0] + (i * 0.01) - 0.02),
      lng: v.lng ?? (center[1] + (i * 0.01) - 0.02),
    }));
    initialVehicles.current = all;
    setAnimatedVehicles(all);
  }, [vehicles]); // re-run if `vehicles` prop changes

  // Create inline worker to compute smooth positions (if supported).
  useEffect(() => {
    const supportsWorker = typeof Worker !== 'undefined';

    if (supportsWorker) {
      const workerCode = `
        // Worker: Performs periodic position updates for vehicles.
        let vehicles = [];
        let center = [12.9716, 77.5946];
        let running = false;

        function idSeed(id) {
          let h = 2166136261 >>> 0;
          for (let i = 0; i < id.length; i++) {
            h ^= id.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
          }
          return (h % 10000) / 10000;
        }

        function step() {
          const t = Date.now() / 10000;
          const [cLat, cLng] = center;
          const out = vehicles.map((v, i) => {
            if (v && v.speed && v.speed > 0) {
              const seed = idSeed(String(v.id || i));
              const radius = 0.005 * (1 + (v.speed ? Math.min(v.speed,120)/120 : 0));
              const angle = t + seed * Math.PI * 2;
              return Object.assign({}, v, {
                lat: cLat + Math.sin(angle + seed) * radius,
                lng: cLng + Math.cos(angle + seed) * radius
              });
            }
            return v;
          });
          postMessage({ type: 'tick', vehicles: out });
        }

        onmessage = function(e) {
          const data = e.data;
          if (data.type === 'init') {
            vehicles = data.vehicles || [];
            center = data.center || center;
            if (!running) {
              running = true;
              // Use setInterval inside worker (requestAnimationFrame isn't available)
              self._interval = setInterval(step, 50); // 20Hz updates from worker
            }
          } else if (data.type === 'update') {
            vehicles = data.vehicles || vehicles;
          } else if (data.type === 'stop') {
            running = false;
            clearInterval(self._interval);
            close();
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const w = new Worker(url);
      workerRef.current = w;

      // Send init message with current vehicles and center
      w.postMessage({ type: 'init', vehicles: initialVehicles.current, center });

      // Worker tick handler: update React state when we receive new positions
      const onMessage = (ev) => {
        const d = ev.data;
        if (d && d.type === 'tick' && Array.isArray(d.vehicles)) {
          // Update state in batches; it's fine to set state frequently because React will batch updates
          setAnimatedVehicles(d.vehicles);
        }
      };
      w.addEventListener('message', onMessage);

      // If the incoming `vehicles` prop changes, send a quick update
      const updateVehicles = () => {
        w.postMessage({ type: 'update', vehicles: initialVehicles.current });
      };

      // Listen for prop changes (we already update initialVehicles in useEffect above),
      // so just post an update after a small debounce to avoid message storms.
      const debounce = (fn, ms = 100) => {
        let id;
        return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
      };
      const debouncedUpdate = debounce(updateVehicles, 150);
      debouncedUpdate();

      return () => {
        try {
          w.postMessage({ type: 'stop' });
          w.terminate();
        } catch (err) {
          // ignore
        }
        URL.revokeObjectURL(url);
      };
    } else {
      // Fallback: main-thread requestAnimationFrame loop
      let running = true;
      const tick = () => {
        if (!running) return;
        setAnimatedVehicles(prev => calcPositions(prev.length ? prev : initialVehicles.current, center));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        running = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, []); // run once on mount

  // If the `vehicles` prop changes frequently, push updates to the worker or update local state
  useEffect(() => {
    initialVehicles.current = [...vehicles, ...dummyVehicles].map((v, i) => ({
      ...v,
      lat: v.lat ?? (center[0] + (i * 0.01) - 0.02),
      lng: v.lng ?? (center[1] + (i * 0.01) - 0.02),
    }));

    if (workerRef.current) {
      try {
        workerRef.current.postMessage({ type: 'update', vehicles: initialVehicles.current });
      } catch (err) {
        // ignore; worker may be terminating
      }
    } else {
      // if no worker, update the state directly so fallback rAF loop has the right base
      setAnimatedVehicles(initialVehicles.current);
    }
  }, [vehicles]); // push fresh vehicles into the engine

  // Helper: color mapping by status
  function statusColor(status) {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'idle': return '#f59e0b'; // yellow
      case 'maintenance': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  }

  // Render
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <style>{styles}</style>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {animatedVehicles.map(vehicle => (
          vehicle.lat && vehicle.lng ? (
            <CircleMarker
              key={vehicle.id}
              center={[vehicle.lat, vehicle.lng]}
              radius={8}
              pane="overlayPane"
              // Leaflet renders CircleMarker with the canvas renderer if preferCanvas=true
              pathOptions={{
                color: '#ffffff', // outer stroke
                weight: 2,
                fillColor: statusColor(vehicle.status),
                fillOpacity: 1,
                className: vehicle.speed > 0 ? 'blinking' : '',
              }}
              eventHandlers={{
                click: () => onVehicleClick && onVehicleClick(vehicle),
              }}
            >
              <Popup>
                <div className="vehicle-popup">
                  <h3 style={{ margin: 0 }}>{vehicle.name}</h3>
                  <p style={{ margin: '4px 0 0 0' }}>Status: {vehicle.status}</p>
                  <p style={{ margin: '2px 0 0 0' }}>Speed: {vehicle.speed ?? '—'} km/h</p>
                  <p style={{ margin: '2px 0 0 0' }}>Fuel: {vehicle.fuel_level ?? '—'}%</p>
                </div>
              </Popup>
            </CircleMarker>
          ) : null
        ))}

        {routesVisible && optimizedRoutes?.routes?.map((route, index) => (
          <Polyline
            key={index}
            positions={route.stops.map(stop => [stop[0], stop[1]])}
            color={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]}
            weight={4}
            pane="overlayPane"
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
