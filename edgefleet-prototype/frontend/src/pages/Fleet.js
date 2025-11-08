import React, { useState, useEffect } from 'react';
import { 
  FiTruck, FiPlus, FiEdit2, FiTrash2, FiSearch, 
  FiFilter, FiDownload, FiUpload, FiRefreshCw, FiX,
  FiMapPin, FiNavigation
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Fleet = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'truck',
    status: 'active',
    fuelType: 'diesel',
    capacity: '',
    registrationNumber: '',
    lastServiceDate: '',
    nextServiceDate: '',
    lat: null,
    lng: null
  });
  
  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            lat: parseFloat(latitude.toFixed(6)),
            lng: parseFloat(longitude.toFixed(6))
          }));
          toast.success('Location updated successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error(`Error getting location: ${error.message}`);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  // Fetch vehicles from API
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/vehicles`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched vehicles:', data);
      
      // The backend returns the array directly
      setVehicles(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      alert(`Failed to fetch vehicles: ${error.message}`);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const url = editingVehicle 
        ? `${baseUrl}/api/vehicles/${editingVehicle.id}`
        : `${baseUrl}/api/vehicles`;
      
      const method = editingVehicle ? 'PUT' : 'POST';
      
      // Prepare the data in the format expected by the backend
      const vehicleData = {
        name: formData.name.trim(),
        type: formData.type,
        status: formData.status,
        fuel_type: formData.fuelType,
        capacity: formData.capacity ? parseFloat(formData.capacity) : null,
        registration_number: formData.registrationNumber?.trim() || null,
        last_service_date: formData.lastServiceDate || null,
        next_service_date: formData.nextServiceDate || null,
        lat: formData.lat,
        lng: formData.lng
      };
      
      console.log('Sending request to:', url);
      console.log('Request payload:', vehicleData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData)
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Server responded with error:', response.status, responseData);
        throw new Error(responseData.detail || `Failed to save vehicle: ${response.statusText}`);
      }

      console.log('Vehicle saved successfully:', responseData);
      await fetchVehicles();
      setShowAddModal(false);
      setFormData({
        id: '',
        name: '',
        type: 'truck',
        status: 'active',
        fuelType: 'diesel',
        capacity: '',
        registrationNumber: '',
        lastServiceDate: '',
        nextServiceDate: ''
      });
      setEditingVehicle(null);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      id: vehicle.id,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      fuelType: vehicle.fuel_type || 'diesel',
      capacity: vehicle.capacity || '',
      registrationNumber: vehicle.registration_number || '',
      lastServiceDate: vehicle.last_service_date ? vehicle.last_service_date.split('T')[0] : '',
      nextServiceDate: vehicle.next_service_date ? vehicle.next_service_date.split('T')[0] : '',
      lat: vehicle.lat || null,
      lng: vehicle.lng || null
    });
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/vehicles/${id}`,
          { 
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete vehicle');
        }
        
        await fetchVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  // Export vehicles to CSV
  const exportToCSV = () => {
    if (vehicles.length === 0) {
      alert('No vehicles to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'Name',
      'Type',
      'Status',
      'Fuel Type',
      'Capacity (kg)',
      'Registration Number',
      'Last Service Date',
      'Next Service Date'
    ];

    // Convert vehicle data to CSV rows
    const rows = vehicles.map(vehicle => [
      `"${vehicle.name || ''}"`,
      `"${vehicle.type || ''}"`,
      `"${vehicle.status || ''}"`,
      `"${vehicle.fuel_type || ''}"`,
      `"${vehicle.capacity || ''}"`,
      `"${vehicle.registration_number || ''}"`,
      `"${vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : ''}"`,
      `"${vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : ''}"`
    ].join(','));

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vehicles_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.registration_number && vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fleet Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
            title="Export to CSV"
          >
            <FiDownload className="mr-2" /> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FiPlus className="mr-2" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search vehicles..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border rounded-lg flex items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiFilter className="mr-2" /> Filter
            </button>
            <button className="px-4 py-2 border rounded-lg flex items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiDownload className="mr-2" /> Export
            </button>
            <button 
              onClick={fetchVehicles}
              className="p-2 border rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-8 text-center">
            <FiTruck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No vehicles found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try a different search term' : 'Get started by adding a new vehicle'}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Add Vehicle
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Registration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FiTruck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {vehicle.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vehicle.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {vehicle.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {vehicle.status || 'inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {vehicle.registrationNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {vehicle.lat && vehicle.lng ? 
                        `${Number(vehicle.lat).toFixed(4)}, ${Number(vehicle.lng).toFixed(4)}` : 
                        <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        <FiEdit2 className="inline-block" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FiTrash2 className="inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVehicle(null);
                    setFormData({
                      id: '',
                      name: '',
                      type: 'truck',
                      status: 'active',
                      fuelType: 'diesel',
                      capacity: '',
                      registrationNumber: '',
                      lastServiceDate: '',
                      nextServiceDate: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vehicle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Delivery Truck 1"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vehicle Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      required
                      value={formData.type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="truck">Truck</option>
                      <option value="van">Van</option>
                      <option value="suv">SUV</option>
                      <option value="sedan">Sedan</option>
                      <option value="bike">Motorcycle</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fuel Type
                    </label>
                    <select
                      id="fuelType"
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="cng">CNG</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Capacity (kg)
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      min="0"
                      step="0.01"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 1000"
                    />
                  </div>

                  <div>
                    <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., KA01AB1234"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastServiceDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Service Date
                    </label>
                    <input
                      type="date"
                      id="lastServiceDate"
                      name="lastServiceDate"
                      value={formData.lastServiceDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* Location Section */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <FiMapPin className="inline mr-1" /> Vehicle Location
                      </label>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="flex items-center text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 py-1 px-2 rounded"
                      >
                        <FiNavigation className="mr-1" /> Get Current Location
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Latitude</label>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm">
                          {formData.lat !== null ? formData.lat.toFixed(6) : 'Not set'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Longitude</label>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm">
                          {formData.lng !== null ? formData.lng.toFixed(6) : 'Not set'}
                        </div>
                      </div>
                    </div>
                    {formData.lat !== null && formData.lng !== null && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        Location set: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingVehicle(null);
                      setFormData({
                        id: '',
                        name: '',
                        type: 'truck',
                        status: 'active',
                        fuelType: 'diesel',
                        capacity: '',
                        registrationNumber: '',
                        lastServiceDate: '',
                        nextServiceDate: '',
                        lat: null,
                        lng: null
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
