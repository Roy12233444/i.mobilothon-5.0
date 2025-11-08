import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, AlertCircle, XCircle, 
  Filter, RefreshCw, AlertTriangle, Info, 
  Search, Clock, Calendar, X, AlertOctagon, 
  ChevronDown, ChevronUp, ChevronRight, ExternalLink
} from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AlertCard = ({ alert, onUpdateStatus, onDelete, onView }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity) => {
    return severity?.charAt(0).toUpperCase() + severity?.slice(1) || 'Info';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'acknowledged': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'open': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatTimeAgo = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleStatusUpdate = async (status) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${API_URL}/api/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, user_id: 'current-user' })
      });
      
      if (!response.ok) throw new Error('Failed to update alert status');
      
      const updatedAlert = await response.json();
      onUpdateStatus(updatedAlert);
      toast.success(`Alert marked as ${status}`);
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error('Failed to update alert status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        const response = await fetch(`${API_URL}/api/alerts/${alert.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete alert');
        
        onDelete(alert.id);
        toast.success('Alert deleted successfully');
      } catch (error) {
        console.error('Error deleting alert:', error);
        toast.error('Failed to delete alert');
      }
    }
  };

  return (
    <motion.div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-3 transition-all duration-200 hover:shadow-md ${
        isExpanded ? 'ring-2 ring-blue-500' : ''
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <div 
        className="p-4 cursor-pointer transition-colors duration-150"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`w-2 h-16 rounded-full ${getSeverityColor(alert.severity)}`}></div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {alert.title || 'Untitled Alert'}
                </h3>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getSeverityColor(alert.severity)
                  } bg-opacity-10 text-${getSeverityColor(alert.severity).replace('bg-', '')} dark:bg-opacity-20`}>
                    {getSeverityText(alert.severity)}
                  </span>
                  
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {alert.type || 'System'}
                  </span>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {alert.message || 'No description provided'}
              </p>
              
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  {getStatusIcon(alert.status)}
                  <span className="ml-1.5 capitalize">{alert.status || 'unknown'}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
                  <span>{formatTimeAgo(alert.timestamp || alert.created_at)}</span>
                </div>
                
                {alert.source && (
                  <div className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                    <span className="truncate max-w-[120px]" title={alert.source}>
                      {alert.source}
                    </span>
                  </div>
                )}
                
                {alert.related_id && (
                  <div className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                    <span className="font-mono text-xs">ID: {alert.related_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onView?.(alert);
              }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="View details"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Section */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-blue-500" />
                      Alert Details
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            {new Date(alert.created_at).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {alert.updated_at && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {new Date(alert.updated_at).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        {alert.source && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Source</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{alert.source}</p>
                          </div>
                        )}
                        {alert.related_id && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reference ID</p>
                            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">{alert.related_id}</p>
                          </div>
                        )}
                      </div>
                      
                      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Metadata</p>
                          <pre className="text-xs bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border border-gray-100 dark:border-gray-700 overflow-x-auto max-h-40">
                            {JSON.stringify(alert.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {alert.message && (
                    <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                        Full Message
                      </h4>
                      <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                        {alert.message}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Actions Section */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-blue-500" />
                      Quick Actions
                    </h4>
                    <div className="space-y-2">
                      {alert.status !== 'acknowledged' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate('acknowledged');
                          }}
                          disabled={isUpdating}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
                            bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200
                            dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:text-yellow-400 dark:hover:bg-yellow-900/30
                            focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 disabled:opacity-50"
                        >
                          <span>Mark as Acknowledged</span>
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {alert.status !== 'resolved' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate('resolved');
                          }}
                          disabled={isUpdating}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
                            bg-green-50 hover:bg-green-100 text-green-800 border border-green-200
                            dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400 dark:hover:bg-green-900/30
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                        >
                          <span>Resolve Alert</span>
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate('open');
                          }}
                          disabled={isUpdating}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
                            bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200
                            dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400 dark:hover:bg-blue-900/30
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                        >
                          <span>Reopen Alert</span>
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this alert? This action cannot be undone.')) {
                            handleDelete();
                          }
                        }}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
                          bg-red-50 hover:bg-red-100 text-red-700 border border-red-200
                          dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/30
                          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
                      >
                        <span>Delete Alert</span>
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      Alert Status
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(alert.status).replace('text-', 'bg-')}`}></div>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">{alert.status || 'unknown'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.status === 'open' && 'This alert requires attention'}
                          {alert.status === 'acknowledged' && 'This alert has been acknowledged'}
                          {alert.status === 'resolved' && 'This alert has been resolved'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Alerts = () => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    type: 'all',
    search: '',
    dateRange: 'today'
  });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    acknowledged: 0,
    resolved: 0
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/alerts`);
        if (!response.ok) throw new Error('Failed to fetch alerts');
        const result = await response.json();
        const alertsData = result.alerts || [];
        setAlerts(alertsData);
        
        // Update stats
        setStats({
          total: alertsData.length,
          open: alertsData.filter(a => a.status === 'open').length,
          acknowledged: alertsData.filter(a => a.status === 'acknowledged').length,
          resolved: alertsData.filter(a => a.status === 'resolved' || a.status === 'closed').length
        });
      } catch (error) {
        console.error('Error fetching alerts:', error);
        toast.error('Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleUpdateStatus = (updatedAlert) => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(a => 
        a.id === updatedAlert.id ? updatedAlert : a
      );
      setStats({
        total: updatedAlerts.length,
        open: updatedAlerts.filter(a => a.status === 'open').length,
        acknowledged: updatedAlerts.filter(a => a.status === 'acknowledged').length,
        resolved: updatedAlerts.filter(a => a.status === 'resolved').length
      });
      return updatedAlerts;
    });
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.filter(a => a.id !== alertId);
      setStats({
        total: updatedAlerts.length,
        open: updatedAlerts.filter(a => a.status === 'open').length,
        acknowledged: updatedAlerts.filter(a => a.status === 'acknowledged').length,
        resolved: updatedAlerts.filter(a => a.status === 'resolved').length
      });
      return updatedAlerts;
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    // Filter by status
    if (filters.status !== 'all' && alert.status !== filters.status) return false;
    
    // Filter by severity
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
    
    // Filter by type
    if (filters.type !== 'all' && alert.type !== filters.type) return false;
    
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        alert.title.toLowerCase().includes(searchLower) ||
        alert.message.toLowerCase().includes(searchLower) ||
        (alert.source && alert.source.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/alerts`);
      if (!response.ok) throw new Error('Failed to refresh alerts');
      const result = await response.json();
      const alertsData = result.alerts || [];
      setAlerts(alertsData);
      setStats({
        total: alertsData.length,
        open: alertsData.filter(a => a.status === 'open').length,
        acknowledged: alertsData.filter(a => a.status === 'acknowledged').length,
        resolved: alertsData.filter(a => a.status === 'resolved' || a.status === 'closed').length
      });
      toast.success('Alerts refreshed');
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      toast.error('Failed to refresh alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setTimeout(() => setSelectedAlert(null), 300); // Wait for animation to complete
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="mr-2 text-indigo-600" />
            Alerts
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Filters</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Filter alerts by different criteria
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Search */}
            <div className="sm:col-span-3">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Search alerts..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Severity */}
            <div className="sm:col-span-1">
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Severity
              </label>
              <select
                id="severity"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            
            {/* Status */}
            <div className="sm:col-span-1">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            {/* Date Range */}
            <div className="sm:col-span-1">
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range
              </label>
              <select
                id="dateRange"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Bell className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Alerts</h3>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Open</h3>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.open}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Acknowledged</h3>
              <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{stats.acknowledged}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</h3>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="mr-2 text-indigo-600" />
            Alerts
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-500">Total Alerts</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-500">Open</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats.open}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-sm font-medium text-gray-500">Acknowledged</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600">{stats.acknowledged}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-500">Resolved</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search alerts</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Filter alerts..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
          <select 
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select 
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Range</label>
          <select 
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              {filteredAlerts.length} {filteredAlerts.length === 1 ? 'Alert' : 'Alerts'}
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw 
                className={`w-4 h-4 mr-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 ${loading ? 'animate-spin' : ''}`}
                onClick={handleRefresh}
              />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-b-lg">
            {filteredAlerts.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {filteredAlerts.map((alert) => (
                    <motion.li 
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertCard 
                        alert={alert} 
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteAlert}
                        onView={handleViewAlert}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                  <div className="relative">
                    <div className="absolute -inset-2">
                      <div className="w-full h-full mx-auto rotate-180 opacity-30 blur-lg filter" style={{
                        background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 30%, #F59E0B 60%, #EF4444 100%)'
                      }}></div>
                    </div>
                    <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                      <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Clear!</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {filters.search || filters.status !== 'all' || filters.severity !== 'all' || filters.dateRange !== 'today'
                          ? 'No alerts match your current filters.'
                          : 'No active alerts detected in your fleet. Everything is running smoothly.'}
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            <span>All systems operational</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                            <span>Monitoring active</span>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          {filters.search || filters.status !== 'all' || filters.severity !== 'all' || filters.dateRange !== 'today' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFilters({
                                  search: '',
                                  status: 'all',
                                  severity: 'all',
                                  type: 'all',
                                  dateRange: 'today'
                                });
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                              <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                              Clear all filters
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                What would you like to do next?
                              </p>
                              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Add test alert
                                    const testAlert = {
                                      id: 'test-' + Date.now(),
                                      type: 'info',
                                      severity: 'info',
                                      title: 'Test Alert',
                                      message: 'This is a test alert to verify the system is working correctly.',
                                      timestamp: new Date().toISOString(),
                                      status: 'open',
                                      source: 'System Test'
                                    };
                                    // This would typically be handled by your state management
                                    // For now, we'll just show a toast
                                    toast.success('Test alert created successfully!');
                                  }}
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                  <AlertCircle className="-ml-1 mr-2 h-4 w-4" />
                                  Test Alert System
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Navigate to dashboard or other relevant page
                                    // navigate('/dashboard');
                                    toast.info('Navigating to dashboard...');
                                  }}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                  <span>Go to Dashboard</span>
                                  <ChevronRight className="ml-2 -mr-1 h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredAlerts.length}</span> of{' '}
                  <span className="font-medium">{filteredAlerts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <a href="#" aria-current="page" className="z-10 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    1
                  </a>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Alert Detail Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && selectedAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleCloseSidebar}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="px-4 py-6 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Alert Details</h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {selectedAlert.id || 'No ID available'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseSidebar}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
                    >
                      <span className="sr-only">Close panel</span>
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="space-y-6">
                      {/* Alert Header */}
                      <div>
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {selectedAlert.title || 'Untitled Alert'}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getSeverityColor(selectedAlert.severity)
                              } bg-opacity-10 text-${getSeverityColor(selectedAlert.severity).replace('bg-', '')} dark:bg-opacity-20`}>
                                {getSeverityText(selectedAlert.severity)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                              {selectedAlert.message || 'No description provided'}
                            </p>
                          </div>
                          
                          {/* Status */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
                            <div className="mt-1 flex items-center">
                              {getStatusIcon(selectedAlert.status)}
                              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {selectedAlert.status || 'unknown'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Details</h4>
                            <dl className="space-y-3">
                              <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
                                  {selectedAlert.type || 'System'}
                                </dd>
                              </div>
                              
                              <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
                                  {new Date(selectedAlert.created_at).toLocaleString()}
                                </dd>
                              </div>
                              
                              {selectedAlert.updated_at && (
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
                                    {new Date(selectedAlert.updated_at).toLocaleString()}
                                  </dd>
                                </div>
                              )}
                              
                              {selectedAlert.source && (
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
                                    {selectedAlert.source}
                                  </dd>
                                </div>
                              )}
                              
                              {selectedAlert.related_id && (
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Related ID</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2">
                                    {selectedAlert.related_id}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                          
                          {/* Metadata */}
                          {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metadata</h4>
                              <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
                                {JSON.stringify(selectedAlert.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={handleCloseSidebar}
                          className="bg-white py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Close
                        </button>
                        
                        {selectedAlert.status !== 'acknowledged' && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateStatus({ ...selectedAlert, status: 'acknowledged' });
                              handleCloseSidebar();
                            }}
                            className="inline-flex items-center px-4 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                          >
                            <AlertCircle className="-ml-1 mr-2 h-4 w-4" />
                            Acknowledge
                          </button>
                        )}
                        
                        {selectedAlert.status !== 'resolved' ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateStatus({ ...selectedAlert, status: 'resolved' });
                              handleCloseSidebar();
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                            Mark as Resolved
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateStatus({ ...selectedAlert, status: 'open' });
                              handleCloseSidebar();
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <AlertTriangle className="-ml-1 mr-2 h-4 w-4" />
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
};

export default Alerts;