import React from 'react';

const StatCard = ({ title, value, icon, color = 'bg-blue-500' }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10 text-${color.replace('bg-', 'text-')}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
