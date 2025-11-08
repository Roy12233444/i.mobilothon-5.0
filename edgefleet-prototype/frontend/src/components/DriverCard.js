import React from 'react';
import PropTypes from 'prop-types';
import { FaUser, FaPhone, FaEnvelope, FaIdCard, FaCar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const DriverCard = ({ driver, onClick, isSelected = false }) => {
  if (!driver) return null;

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800'
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
            <FaUser className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{driver.first_name} {driver.last_name}</h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <FaIdCard className="mr-1" />
              <span>ID: {driver.id || 'N/A'}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <FaPhone className="mr-1" />
              <span>{driver.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <FaEnvelope className="mr-1" />
              <span className="truncate">{driver.email || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[driver.status] || statusColors.inactive
          }`}>
            {driver.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Inactive'}
          </span>
          
          {driver.vehicle_id && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex items-center justify-end">
                <FaCar className="mr-1 text-blue-500" />
                <span>Assigned Vehicle: {driver.vehicle_id}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {(driver.location || driver.last_active) && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          <div className="flex justify-between">
            {driver.location && (
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-1 text-red-500" />
                <span>
                  {driver.location.lat ? 
                    `${driver.location.lat.toFixed(4)}, ${driver.location.lng.toFixed(4)}` : 
                    'Location unavailable'}
                </span>
              </div>
            )}
            {driver.last_active && (
              <div className="flex items-center">
                <FaClock className="mr-1" />
                <span>Last active: {new Date(driver.last_active).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

DriverCard.propTypes = {
  driver: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    status: PropTypes.oneOf(['active', 'inactive', 'on_leave', 'suspended']),
    vehicle_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    location: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    last_active: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  onClick: PropTypes.func,
  isSelected: PropTypes.bool
};

export default DriverCard;