import React from 'react';
import PropTypes from 'prop-types';
import { 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaBell, 
  FaCarCrash,
  FaCarSide,
  FaClock,
  FaMapMarkerAlt
} from 'react-icons/fa';

const AlertBadge = ({ type, message, timestamp, location, onClick, className = '' }) => {
  const alertConfig = {
    critical: {
      icon: <FaCarCrash className="text-xl" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: <FaExclamationTriangle className="text-xl" />,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: <FaInfoCircle className="text-xl" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-500'
    },
    default: {
      icon: <FaBell className="text-xl" />,
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      iconColor: 'text-gray-500'
    },
    speeding: {
      icon: <FaCarSide className="text-xl" />,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      iconColor: 'text-orange-500',
      label: 'Speeding'
    },
    maintenance: {
      icon: <FaTools className="text-xl" />,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      iconColor: 'text-purple-500',
      label: 'Maintenance'
    }
  };

  const config = alertConfig[type] || alertConfig.default;
  const formattedType = config.label || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div 
      className={`flex items-start p-4 mb-3 rounded-lg border ${config.bg} ${config.border} ${config.text} ${className} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className={`p-2 rounded-full ${config.iconColor} bg-opacity-20 mr-3`}>
        {config.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">{formattedType}</span>
          {timestamp && (
            <span className="text-xs opacity-75 flex items-center">
              <FaClock className="mr-1" />
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm">{message}</p>
        {location && (
          <div className="mt-2 text-xs opacity-75 flex items-center">
            <FaMapMarkerAlt className="mr-1" />
            {location.lat && location.lng 
              ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
              : 'Location not available'}
          </div>
        )}
      </div>
    </div>
  );
};

AlertBadge.propTypes = {
  type: PropTypes.oneOf([
    'critical', 'warning', 'info', 'speeding', 'maintenance', 'default'
  ]).isRequired,
  message: PropTypes.string.isRequired,
  timestamp: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ]),
  location: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default AlertBadge;