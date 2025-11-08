import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RouteOptimization from './pages/RouteOptimization';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import AIAgents from './pages/AIAgents';
import TrafficAnalysisPage from './pages/TrafficAnalysisPage';
import CameraDashboardPage from './pages/CameraDashboardPage';
import './index.css'; // Import the main CSS file that contains Tailwind directives
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          {/* Sidebar */}
          <div 
            className={`relative flex-shrink-0 h-full transform transition-all duration-300 ease-in-out ${
              isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
            } ${isMobile && !isSidebarOpen ? 'hidden' : 'block'}`}
          >
            <Sidebar isCollapsed={!isSidebarOpen} onClose={isMobile ? () => setIsSidebarOpen(false) : null} />
          </div>
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top navbar */}
            <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
              <div className="flex items-center h-16 px-4 sm:px-6">
                <button
                  className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none mr-4"
                  onClick={toggleSidebar}
                  aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {isSidebarOpen ? (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  EdgeFleet Dashboard
                </h1>
              </div>
            </header>
            
            {/* Page content */}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/route-optimization" element={<RouteOptimization />} />
                  <Route path="/fleet" element={<Fleet />} />
                  <Route path="/drivers" element={<Drivers />} />
                  <Route path="/ai-agents" element={<AIAgents />} />
                  <Route path="/camera-dashboard" element={<CameraDashboardPage />} />
                  <Route path="/traffic-analysis" element={<TrafficAnalysisPage />} />
                  <Route path="*" element={<div>404 Not Found</div>} />
                  {/* Add more routes as needed */}
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </Router>
  );
}

export default App;
