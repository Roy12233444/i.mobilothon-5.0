import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiRefreshCw, 
  FiPlay, 
  FiPause, 
  FiSettings, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiClock,
  FiActivity,
  FiTool,
  FiTruck,
  FiUserCheck,
  FiPackage,
  FiTrendingUp,
  FiShield,
  FiCloudRain
} from 'react-icons/fi';

const AIAgents = () => {
  const [agents, setAgents] = useState([
    {
      id: 'route-optimization',
      name: 'Route Optimization Agent',
      description: 'Dynamically optimizes delivery routes based on real-time data',
      status: 'active',
      icon: <FiActivity className="text-blue-500" />,
      lastRun: '2 minutes ago',
      metrics: {
        efficiency: '87%',
        fuelSaved: '15%',
        timeSaved: '22%'
      }
    },
    {
      id: 'predictive-maintenance',
      name: 'Predictive Maintenance',
      description: 'Predicts vehicle maintenance needs before breakdowns occur',
      status: 'active',
      icon: <FiTool className="text-green-500" />,
      lastRun: '1 hour ago',
      metrics: {
        issuesDetected: 3,
        costSaved: '$2,450',
        uptime: '99.2%'
      }
    },
    {
      id: 'driver-behavior',
      name: 'Driver Behavior Analyst',
      description: 'Monitors and improves driver performance and safety',
      status: 'inactive',
      icon: <FiUserCheck className="text-purple-500" />,
      lastRun: 'Never',
      metrics: {
        safetyScore: '92%',
        incidents: 2,
        trainingNeeded: 1
      }
    },
    {
      id: 'load-optimization',
      name: 'Load Optimization',
      description: 'Optimizes cargo loading for maximum efficiency',
      status: 'inactive',
      icon: <FiPackage className="text-yellow-500" />,
      lastRun: 'Never',
      metrics: {
        spaceUtilized: '78%',
        weightDist: 'Optimal',
        tripsSaved: '12%'
      }
    },
    {
      id: 'demand-forecast',
      name: 'Demand Forecasting',
      description: 'Predicts delivery demand and optimizes resource allocation',
      status: 'inactive',
      icon: <FiTrendingUp className="text-pink-500" />,
      lastRun: 'Never',
      metrics: {
        accuracy: '89%',
        costReduction: '18%',
        utilization: '82%'
      }
    },
    {
      id: 'security-monitor',
      name: 'Security Monitor',
      description: 'Detects security threats and unusual activities',
      status: 'active',
      icon: <FiShield className="text-red-500" />,
      lastRun: '5 minutes ago',
      metrics: {
        threatsBlocked: 24,
        alerts: 3,
        riskLevel: 'Low'
      }
    },
    {
      id: 'sustainability',
      name: 'Sustainability Agent',
      description: 'Reduces environmental impact and improves efficiency',
      status: 'inactive',
      icon: <FiCloudRain className="text-teal-500" />,
      lastRun: 'Never',
      metrics: {
        co2Reduced: '1.2t',
        fuelSaved: '8%',
        efficiency: '76%'
      }
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    autoRefresh: true,
    alertThreshold: 'medium',
    dataRetention: '30 days',
    notificationEnabled: true
  });

  const toggleAgentStatus = (agentId) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { 
            ...agent, 
            status: agent.status === 'active' ? 'inactive' : 'active',
            lastRun: agent.status === 'inactive' ? 'Just now' : agent.lastRun
          } 
        : agent
    ));
  };

  const refreshAgent = (agentId) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, lastRun: 'Just now' } 
        : agent
    ));
  };

  const openSettings = (agent) => {
    setSelectedAgent(agent);
    setIsSettingsOpen(true);
  };

  const updateSettings = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and monitor your AI-powered fleet optimization agents
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => window.location.reload()}
            >
              <FiRefreshCw className="inline mr-2" /> Refresh All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border-l-4 ${
                agent.status === 'active' 
                  ? 'border-green-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900 bg-opacity-50 rounded-lg">
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => refreshAgent(agent.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Refresh"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openSettings(agent)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Settings"
                    >
                      <FiSettings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {agent.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="ml-3 text-gray-500 dark:text-gray-400 flex items-center">
                        <FiClock className="mr-1 w-3.5 h-3.5" />
                        {agent.lastRun}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        agent.status === 'active'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800'
                      }`}
                    >
                      {agent.status === 'active' ? 'Stop' : 'Start'}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {Object.entries(agent.metrics).map(([key, value]) => (
                      <div key={key} className="p-2 bg-gray-50 dark:bg-gray-750 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedAgent.name} Settings
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => updateSettings({ autoRefresh: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Auto-refresh data
                  </span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alert Threshold
                </label>
                <select
                  value={settings.alertThreshold}
                  onChange={(e) => updateSettings({ alertThreshold: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="low">Low - Fewer alerts</option>
                  <option value="medium">Medium - Balanced</option>
                  <option value="high">High - More alerts</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Retention
                </label>
                <select
                  value={settings.dataRetention}
                  onChange={(e) => updateSettings({ dataRetention: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="7 days">7 days</option>
                  <option value="30 days">30 days</option>
                  <option value="90 days">90 days</option>
                  <option value="1 year">1 year</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notificationEnabled}
                    onChange={(e) => updateSettings({ notificationEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enable notifications
                  </span>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save settings logic here
                  setIsSettingsOpen(false);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AIAgents;
