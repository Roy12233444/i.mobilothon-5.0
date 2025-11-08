import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiTruck, 
  FiUsers, 
  FiAlertCircle,
  FiMoon, 
  FiSun, 
  FiMap,
  FiCpu,
  FiActivity,
  FiVideo
} from 'react-icons/fi';
// Theme context is still used for consistency, but dark mode is disabled

const sidebarItems = [
  { icon: <FiHome />, label: 'Dashboard', path: '/' },
  { icon: <FiMap />, label: 'Route Optimization', path: '/route-optimization' },
  { icon: <FiActivity />, label: 'Traffic Analysis', path: '/traffic-analysis' },
  { icon: <FiTruck />, label: 'Fleet', path: '/fleet' },
  { icon: <FiUsers />, label: 'Drivers', path: '/drivers' },
  { icon: <FiAlertCircle />, label: 'Alerts', path: '/alerts' },
  { icon: <FiCpu />, label: 'AI Agents', path: '/ai-agents' },
  { icon: <FiVideo />, label: 'Camera Dashboard', path: '/camera-dashboard' }
];

const Sidebar = ({ isCollapsed, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="closed"
        animate="open"
        exit="closed"
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold">
                  EF
                </div>
                <span className={`text-xl font-bold text-gray-800 whitespace-nowrap ${
                  isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                } transition-opacity duration-300`}>
                  EdgeFleet
                </span>
                {!isCollapsed && <span className="text-sm text-gray-500"> 2023 EdgeFleet</span>}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-2">
                {sidebarItems.map((item) => (
                  <li key={item.path}>
                    <div className={`flex flex-col ${
                      location.pathname === item.path 
                        ? 'bg-blue-50 dark:bg-blue-900/30' 
                        : ''
                    } rounded-lg`}>
                      <Link
                        to={item.path}
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                          location.pathname === item.path
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50'
                        } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                      >
                        <span className={`${isCollapsed ? 'mx-auto' : 'mr-3'}`}>
                          {item.icon}
                        </span>
                        <span className={`font-medium whitespace-nowrap ${
                          isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                        } transition-opacity duration-300`}>
                          {item.label}
                        </span>
                      </Link>
                      {!isCollapsed && location.pathname === item.path && item.customContent && (
                        <div className="px-4 pb-3 -mt-1">
                          {item.customContent}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User profile */}
            {!isCollapsed && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-medium">
                    U
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin User</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@edgefleet.com</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      );
    };

export default Sidebar;