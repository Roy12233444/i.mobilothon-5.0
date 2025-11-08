import React from 'react';
import PropTypes from 'prop-types';
import { FaTruck, FaGasPump, FaTachometerAlt, FaMapMarkerAlt, FaTools, FaUser } from 'react-icons/fa';

const VehicleCard = ({ vehicle, onClick, isSelected = false }) => {
  if (!vehicle) return null;

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    idle: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800'
  };

  const getStatusText = (status) => {
    const statusMap = {
      active: 'Active',
      idle: 'Idle',
      maintenance: 'In Maintenance',
      offline: 'Offline'
    };
    return statusMap[status] || status;
  };

  return (
    <div 
      className={`border rounded-lg p-4 mb-4 cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'hover:shadow-md hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <FaTruck className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{vehicle.name || `Vehicle ${vehicle.id}`}</h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <span className="font-medium">ID:</span>
              <span className="ml-1">{vehicle.id || 'N/A'}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <span className="font-medium">Plate:</span>
              <span className="ml-1">{vehicle.license_plate || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[vehicle.status] || statusColors.offline
          }`}>
            {getStatusText(vehicle.status || 'offline')}
          </span>
          
          {vehicle.driver_id && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex items-center justify-end">
                <FaUser className="mr-1 text-blue-500" />
                <span>Driver: {vehicle.driver_name || `ID: ${vehicle.driver_id}`}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-gray-600">
            <FaTachometerAlt className="mr-2 text-blue-500" />
            <span>{vehicle.speed || 0} km/h</span>
          </div>
          <div className="flex items-center text-gray-600">
            <FaGasPump className="mr-2 text-green-500" />
            <span>{vehicle.fuel_level !== undefined ? `${vehicle.fuel_level}%` : 'N/A'}</span>
          </div>
          
          {vehicle.location && (
            <div className="col-span-2 flex items-start text-gray-600">
              <FaMapMarkerAlt className="mt-0.5 mr-2 text-red-500 flex-shrink-0" />
              <span className="truncate">
                {vehicle.location.lat ? 
                  `${vehicle.location.lat.toFixed(4)}, ${vehicle.location.lng.toFixed(4)}` : 
                  'Location unavailable'}
              </span>
            </div>
          )}
          
          {vehicle.last_maintenance && (
            <div className="col-span-2 flex items-center text-gray-600">
              <FaTools className="mr-2 text-yellow-500" />
              <span>Last maintenance: {new Date(vehicle.last_maintenance).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

VehicleCard.propTypes = {
  vehicle: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    license_plate: PropTypes.string,
    status: PropTypes.oneOf(['active', 'idle', 'maintenance', 'offline']),
    speed: PropTypes.number,
    fuel_level: PropTypes.number,
    driver_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    driver_name: PropTypes.string,
    location: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    last_maintenance: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  onClick: PropTypes.func,
  isSelected: PropTypes.bool
};

VehicleCard.defaultProps = {
  vehicle: {
    speed: 0,
    fuel_level: 0
  }
};

export default VehicleCard;