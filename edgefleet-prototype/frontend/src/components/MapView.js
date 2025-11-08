// MapView.routes.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Popup,
  Polyline,
  CircleMarker,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Minimal UI CSS
const styles = `
  .vehicle-popup { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
`;

/**
 * Haversine distance (meters)
 */
function haversine([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Linear interpolation between two lat/lngs by t in [0,1]
 */
function lerpLatLng(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Attach route geometry (stops array of [lat, lng]) to vehicle objects.
 * Vehicles are expected to have either routeId or routeIndex to bind to optimizedRoutes.
 */
function attachRoutesToVehicles(vehicles, optimizedRoutes) {
  if (!optimizedRoutes?.routes) return vehicles;
  const routes = optimizedRoutes.routes;
  return vehicles.map(v => {
    let route = null;
    if (v.routeId) {
      route = routes.find(r => r.id === v.routeId || String(r.id) === String(v.routeId));
    }
    if (!route && typeof v.routeIndex === 'number') {
      route = routes[v.routeIndex];
    }
    // fallback: if vehicle has routeStops array already, use it
    if (!route && Array.isArray(v.routeStops)) {
      route = { stops: v.routeStops };
    }
    if (route && Array.isArray(route.stops) && route.stops.length > 0) {
      return { ...v, __routeStops: route.stops };
    }
    return { ...v };
  });
}

/**
 * Build segment distances and cumulative lengths for a route stops array.
 * Returns {segments: [[lat,lng],[lat,lng],...], segLengths: [...], totalLength}
 */
function buildRouteProfile(stops) {
  const segLengths = [];
  const cum = [0];
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const d = haversine(a, b);
    segLengths.push(d);
    total += d;
    cum.push(total);
  }
  return { segLengths, cum, total };
}

/**
 * MapView component
 *
 * Props:
 *  - vehicles: [{id, name, status, speed (km/h), fuel_level, lat?, lng?, routeId?, routeIndex?, loop?}]
 *  - optimizedRoutes: { routes: [ { id?, stops: [[lat,lng], ...] }, ... ] }
 *  - routesVisible: boolean
 *  - onVehicleClick: function(vehicle)
 */
const MapView = ({ vehicles = [], optimizedRoutes, routesVisible, onVehicleClick }) => {
  // Map center: Bangalore
  const center = [12.9716, 77.5946];

  // Dummy fallback vehicles for demo
  const dummyVehicles = [
    { id: 'dummy1', name: 'Truck Extra 1', status: 'active', speed: 20, fuel_level: 80, lat: 12.98, lng: 77.6 },
    { id: 'dummy2', name: 'Van Extra 2', status: 'active', speed: 30, fuel_level: 70, lat: 12.96, lng: 77.58 },
    { id: 'dummy3', name: 'Bus Extra 3', status: 'active', speed: 15, fuel_level: 90, lat: 12.97, lng: 77.62 },
  ];

  const initialVehiclesRef = useRef([]);
  const [animatedVehicles, setAnimatedVehicles] = useState([]);
  const workerRef = useRef(null);
  const rafRef = useRef(null);

  // Initialize vehicles with route attachments and initial positions
  useEffect(() => {
    const merged = [...vehicles, ...dummyVehicles];
    const withRoutes = attachRoutesToVehicles(merged, optimizedRoutes).map((v, i) => {
      const baseLat = v.lat ?? (center[0] + (i * 0.01) - 0.02);
      const baseLng = v.lng ?? (center[1] + (i * 0.01) - 0.02);
      return {
        ...v,
        lat: baseLat,
        lng: baseLng,
        __routeStops: v.__routeStops ?? null,
        __routeProfile: v.__routeStops ? buildRouteProfile(v.__routeStops) : null,
        // __posAlong: meters along route from start (init to 0)
        __posAlong: 0,
        __lastUpdate: Date.now(),
        loop: v.loop !== undefined ? v.loop : true, // default: loop route
      };
    });
    initialVehiclesRef.current = withRoutes;
    setAnimatedVehicles(withRoutes);
  }, [vehicles, optimizedRoutes]);

  // Worker logic: compute next positions along route using distance interpolation
  useEffect(() => {
    const supportsWorker = typeof Worker !== 'undefined';
    if (supportsWorker) {
      // Build worker source
      const workerCode = `
        // worker: route-following position interpolator
        function haversine(lat1, lon1, lat2, lon2) {
          const toRad = (d) => (d * Math.PI) / 180;
          const R = 6371000;
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        }
        function lerp(a, b, t) {
          return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        }

        let vehicles = [];
        let running = false;
        let lastTime = Date.now();

        function buildProfile(stops) {
          const segLengths = [];
          const cum = [0];
          let total = 0;
          for (let i = 0; i < stops.length - 1; i++) {
            const a = stops[i];
            const b = stops[i+1];
            const d = haversine(a[0], a[1], b[0], b[1]);
            segLengths.push(d);
            total += d;
            cum.push(total);
          }
          return { segLengths, cum, total };
        }

        function step() {
          const now = Date.now();
          const dt = (now - lastTime) / 1000.0; // seconds
          lastTime = now;
          const out = vehicles.map(v => {
            try {
              // If vehicle has routeStops, follow it by distance
              if (v.__routeStops && v.__routeStops.length > 1) {
                // Ensure we have profile cached
                if (!v.__routeProfile || v.__routeProfile.total === 0) {
                  v.__routeProfile = buildProfile(v.__routeStops);
                }
                const profile = v.__routeProfile;
                const speedKmh = v.speed || 0;
                const speedMs = (speedKmh * 1000.0) / 3600.0; // m/s
                // Advance along route
                v.__posAlong = (v.__posAlong || 0) + speedMs * dt;
                // Looping handling
                if (v.__posAlong >= profile.total) {
                  if (v.loop === false) {
                    v.__posAlong = profile.total;
                    v.speed = 0;
                  } else {
                    v.__posAlong = v.__posAlong % profile.total;
                  }
                }
                // Find segment
                const cum = profile.cum;
                let segIndex = 0;
                while (segIndex < cum.length - 1 && cum[segIndex + 1] < v.__posAlong) segIndex++;
                const segStart = v.__routeStops[segIndex];
                const segEnd = v.__routeStops[segIndex + 1] || segStart;
                const segLen = profile.segLengths[segIndex] || 0.00001;
                const segOffset = v.__posAlong - cum[segIndex];
                const t = Math.max(0, Math.min(1, segOffset / segLen));
                const pos = lerp(segStart, segEnd, t);
                v.lat = pos[0];
                v.lng = pos[1];
                v.__lastUpdate = now;
                return v;
              } else {
                // No route: gentle random walk to avoid circle motion
                // jitter magnitude proportional to speed
                const sp = (v.speed || 0) / 120.0; // scale 0..1
                const jitter = 0.00005 + 0.0002 * sp;
                const ang = Math.random() * Math.PI * 2;
                v.lat = (v.lat || 0) + Math.sin(ang) * jitter;
                v.lng = (v.lng || 0) + Math.cos(ang) * jitter;
                v.__lastUpdate = now;
                return v;
              }
            } catch (err) {
              return v;
            }
          });
          postMessage({ type: 'tick', vehicles: out });
        }

        onmessage = function(e) {
          const d = e.data;
          if (d.type === 'init') {
            vehicles = d.vehicles || [];
            lastTime = Date.now();
            if (!running) {
              running = true;
              self._interval = setInterval(step, 50); // 20Hz
            }
          } else if (d.type === 'update') {
            vehicles = d.vehicles || vehicles;
          } else if (d.type === 'stop') {
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

      // Init worker with current vehicles
      w.postMessage({ type: 'init', vehicles: initialVehiclesRef.current });

      w.addEventListener('message', (ev) => {
        const d = ev.data;
        if (d && d.type === 'tick' && Array.isArray(d.vehicles)) {
          // update animated vehicles (replace full array for simplicity)
          setAnimatedVehicles(d.vehicles);
        }
      });

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
      // fallback: main-thread rAF loop performing the same interpolation
      let running = true;
      let last = performance.now();
      const tick = () => {
        if (!running) return;
        const now = performance.now();
        const dt = (now - last) / 1000.0;
        last = now;
        setAnimatedVehicles(prev => {
          const arr = prev.map(v => {
            try {
              if (v.__routeStops && v.__routeStops.length > 1) {
                if (!v.__routeProfile || v.__routeProfile.total === 0) {
                  v.__routeProfile = buildRouteProfile(v.__routeStops);
                }
                const profile = v.__routeProfile;
                const speedKmh = v.speed || 0;
                const speedMs = (speedKmh * 1000.0) / 3600.0;
                v.__posAlong = (v.__posAlong || 0) + speedMs * dt;
                if (v.__posAlong >= profile.total) {
                  if (v.loop === false) {
                    v.__posAlong = profile.total;
                    v.speed = 0;
                  } else {
                    v.__posAlong = v.__posAlong % profile.total;
                  }
                }
                const cum = profile.cum;
                let segIndex = 0;
                while (segIndex < cum.length - 1 && cum[segIndex + 1] < v.__posAlong) segIndex++;
                const segStart = v.__routeStops[segIndex];
                const segEnd = v.__routeStops[segIndex + 1] || segStart;
                const segLen = profile.segLengths[segIndex] || 0.00001;
                const segOffset = v.__posAlong - cum[segIndex];
                const t = Math.max(0, Math.min(1, segOffset / segLen));
                const pos = lerpLatLng(segStart, segEnd, t);
                v.lat = pos[0];
                v.lng = pos[1];
                v.__lastUpdate = Date.now();
                return v;
              } else {
                // random walk fallback
                const sp = (v.speed || 0) / 120.0;
                const jitter = 0.00005 + 0.0002 * sp;
                const ang = Math.random() * Math.PI * 2;
                v.lat = (v.lat || center[0]) + Math.sin(ang) * jitter;
                v.lng = (v.lng || center[1]) + Math.cos(ang) * jitter;
                v.__lastUpdate = Date.now();
                return v;
              }
            } catch (err) {
              return v;
            }
          });
          return arr;
        });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        running = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, []); // mount once

  // Push updates to worker when vehicles or routes change
  useEffect(() => {
    // Rebuild vehicles with associated routes and profiles
    const merged = [...vehicles, ...dummyVehicles];
    const withRoutes = attachRoutesToVehicles(merged, optimizedRoutes).map((v, i) => ({
      ...v,
      lat: v.lat ?? (center[0] + (i * 0.01) - 0.02),
      lng: v.lng ?? (center[1] + (i * 0.01) - 0.02),
      __routeStops: v.__routeStops ?? null,
      __routeProfile: v.__routeStops ? buildRouteProfile(v.__routeStops) : null,
      __posAlong: 0,
      __lastUpdate: Date.now(),
      loop: v.loop !== undefined ? v.loop : true,
    }));
    initialVehiclesRef.current = withRoutes;

    if (workerRef.current) {
      try {
        workerRef.current.postMessage({ type: 'update', vehicles: withRoutes });
      } catch (err) {
        // ignore worker errors
      }
    } else {
      setAnimatedVehicles(withRoutes);
    }
  }, [vehicles, optimizedRoutes]);

  // color mapping
  function statusColor(status) {
    switch (status) {
      case 'active': return '#10b981';
      case 'idle': return '#f59e0b';
      case 'maintenance': return '#ef4444';
      default: return '#6b7280';
    }
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <style>{styles}</style>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Render route polylines if visible */}
        {routesVisible && optimizedRoutes?.routes?.map((route, idx) => (
          Array.isArray(route.stops) && route.stops.length > 0 ? (
            <Polyline
              key={route.id ?? idx}
              positions={route.stops.map(s => [s[0], s[1]])}
              color={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]}
              weight={4}
              opacity={0.7}
            />
          ) : null
        ))}

        {/* Render vehicles as CircleMarker (canvas-backed) */}
        {animatedVehicles.map(v => (
          v.lat && v.lng ? (
            <CircleMarker
              key={v.id}
              center={[v.lat, v.lng]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: statusColor(v.status),
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => onVehicleClick && onVehicleClick(v),
              }}
            >
              <Popup>
                <div className="vehicle-popup">
                  <h3 style={{ margin: 0 }}>{v.name}</h3>
                  <p style={{ margin: '4px 0 0 0' }}>Status: {v.status}</p>
                  <p style={{ margin: '2px 0 0 0' }}>Speed: {v.speed ?? '—'} km/h</p>
                  <p style={{ margin: '2px 0 0 0' }}>Fuel: {v.fuel_level ?? '—'}%</p>
                  {v.__routeStops ? <p style={{ margin: '2px 0 0 0' }}>On route</p> : <p style={{ margin: '2px 0 0 0' }}>No route</p>}
                </div>
              </Popup>
            </CircleMarker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
