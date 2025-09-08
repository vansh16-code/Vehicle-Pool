"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// Helper function to get the base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [myVehicleAvailability, setMyVehicleAvailability] = useState([]);
  const [myVehicleBookings, setMyVehicleBookings] = useState([]);
  const [newVehicleForm, setNewVehicleForm] = useState({
    name: "",
    registration_number: "",
    price_per_hour: "",
    available_from: "",
    available_to: "",
  });
  const [newAvailabilityForm, setNewAvailabilityForm] = useState({
    vehicle_id: "",
    pickup_point: "",
    available_from: "",
    available_to: "",
    price_per_hour: "",
  });
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [obdVehicleId, setObdVehicleId] = useState("");
  const [obdData, setObdData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Check for token and redirect to login if not found
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Set the auth token for all subsequent requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 2. Fetch data from various endpoints concurrently
      const [
        userRes,
        vehiclesRes,
        availableVehiclesRes,
        myAvailabilityRes,
        myBookingsRes,
      ] = await Promise.all([
        axios.get(`${API_URL}/api/me`),
        axios.get(`${API_URL}/api/vehicles`),
        axios.get(`${API_URL}/api/vehicle-availability`),
        axios.get(`${API_URL}/api/my-vehicle-availability`),
        axios.get(`${API_URL}/api/my-vehicle-bookings`),
      ]);

      setUser(userRes.data);
      setVehicles(vehiclesRes.data);
      setAvailableVehicles(availableVehiclesRes.data);
      setMyVehicleAvailability(myAvailabilityRes.data);
      setMyVehicleBookings(myBookingsRes.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Please try logging in again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/vehicles`, newVehicleForm);
      setNewVehicleForm({
        name: "",
        registration_number: "",
        price_per_hour: "",
        available_from: "",
        available_to: "",
      });
      fetchData();
      setError("Vehicle created successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create vehicle.");
    }
  };

  const handleCreateAvailability = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/vehicle-availability`, newAvailabilityForm);
      setNewAvailabilityForm({
        vehicle_id: "",
        pickup_point: "",
        available_from: "",
        available_to: "",
        price_per_hour: "",
      });
      fetchData();
      setError("Vehicle availability posted successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to post vehicle availability.");
    }
  };

  const handleBookVehicle = (availability) => {
    setSelectedAvailability(availability);
    setShowLiabilityModal(true);
  };

  const handleAcceptLiability = async () => {
    if (!selectedAvailability) return;
    
    try {
      await axios.post(`${API_URL}/api/vehicle-booking`, {
        availability_id: selectedAvailability.id,
        liability_accepted: true
      });
      setShowLiabilityModal(false);
      setSelectedAvailability(null);
      fetchData();
      setError("Vehicle booked successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to book vehicle.");
      setShowLiabilityModal(false);
    }
  };

  const handleCancelVehicleBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/vehicle-booking/${bookingId}`);
      fetchData();
      setError("Vehicle booking cancelled successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to cancel booking.");
    }
  };

  // Function to format chatbot responses
  const formatBotResponse = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/^\* (.+)$/gm, '• $1') // Convert * to bullet points
      .replace(/^\d+\. (.+)$/gm, '$&') // Keep numbered lists
      .split('\n').map(line => line.trim()).filter(line => line) // Clean up lines
      .join('<br/>'); // Convert line breaks to HTML
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuery) return;
    const newMessages = [...chatMessages, { text: chatQuery, sender: "user" }];
    setChatMessages(newMessages);
    setChatQuery("");

    try {
      // 6. Send query to the "/chatbot" endpoint
      const response = await axios.post(`${API_URL}/api/chatbot`, null, {
        params: { query: chatQuery },
      });
      setChatMessages([
        ...newMessages,
        { text: formatBotResponse(response.data.answer), sender: "bot", isFormatted: true },
      ]);
    } catch (err) {
      setChatMessages([
        ...newMessages,
        { text: "Sorry, I am unable to connect to the assistant. Please try again later.", sender: "bot" },
      ]);
    }
  };

  const handleCreateTestVehicle = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/vehicles/create-test`);
      const vehicleId = response.data.vehicle_id.toString();
      setObdVehicleId(vehicleId);
      setError(`Test vehicle created! Vehicle ID: ${response.data.vehicle_id} (${response.data.name})`);
      // Fetch OBD data for the new vehicle
      setTimeout(() => fetchOBDData(), 500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create test vehicle.");
    }
  };

  const fetchOBDData = async () => {
    if (!obdVehicleId) return;
    try {
      const response = await axios.get(`${API_URL}/api/vehicles/${obdVehicleId}/obd`);
      setObdData(response.data);
    } catch (err) {
      console.error("Failed to fetch OBD data:", err);
    }
  };

  const handleMockOBD = async () => {
    if (!obdVehicleId) {
        setError("Please enter a vehicle ID or create a test vehicle first.");
        return;
    }
    try {
      // 7. Push mock data via "POST /vehicles/{vehicle_id}/obd/mock"
      await axios.post(`${API_URL}/api/vehicles/${obdVehicleId}/obd/mock`);
      setError("Mock OBD data sent successfully!");
      // Fetch updated OBD data after pushing mock data
      fetchOBDData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to mock OBD data.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-bold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 font-sans antialiased text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-green-700">UniPool</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Welcome, {user?.username}!
            </span>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-300 ease-in-out"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Available Vehicles Section */}
        <section className="bg-white p-8 rounded-3xl shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Available Vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableVehicles.length > 0 ? (
              availableVehicles.map((availability) => (
                <div key={availability.id} className="bg-gray-50 p-6 rounded-2xl shadow-md border-t-4 border-green-600">
                  <h3 className="text-xl font-semibold mb-2 text-green-700">{availability.vehicle_name}</h3>
                  <p className="text-sm text-gray-600 mb-1">Registration: {availability.vehicle_registration}</p>
                  <p className="text-sm text-gray-600 mb-1">Pickup: {availability.pickup_point}</p>
                  <p className="text-sm text-gray-600 mb-1">From: {new Date(availability.available_from).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mb-1">To: {new Date(availability.available_to).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mb-4">Price: ₹{parseFloat(availability.price_per_hour).toFixed(2)}/hour</p>
                  <button
                    onClick={() => handleBookVehicle(availability)}
                    className="w-full bg-green-600 text-white py-2 rounded-full font-semibold hover:bg-green-700 transition"
                  >
                    Book Vehicle
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No available vehicles at the moment.</p>
            )}
          </div>
        </section>

        {/* My Vehicle Availability & Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* My Vehicle Availability Section */}
          <section className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My Vehicle Availability</h2>
            <div className="space-y-4">
              {myVehicleAvailability.length > 0 ? (
                myVehicleAvailability.map((availability) => (
                  <div key={availability.id} className="bg-gray-50 p-6 rounded-2xl shadow-sm border-l-4 border-green-600">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-700">{availability.vehicle_name}</h3>
                        <p className="text-sm text-gray-600">Pickup: {availability.pickup_point}</p>
                        <p className="text-sm text-gray-600">From: {new Date(availability.available_from).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">To: {new Date(availability.available_to).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Price: ₹{parseFloat(availability.price_per_hour).toFixed(2)}/hour</p>
                        <p className={`text-sm font-semibold ${availability.is_booked ? 'text-red-600' : 'text-green-600'}`}>
                          {availability.is_booked ? 'Booked' : 'Available'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">You haven&apos;t posted any vehicle availability yet.</p>
              )}
            </div>
          </section>

          {/* My Vehicle Bookings Section */}
          <section className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My Vehicle Bookings</h2>
            <div className="space-y-4">
              {myVehicleBookings.length > 0 ? (
                myVehicleBookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 p-6 rounded-2xl shadow-sm border-l-4 border-green-600">
                    <h3 className="text-lg font-semibold text-green-700">{booking.vehicle_name}</h3>
                    <p className="text-sm text-gray-600">Pickup: {booking.pickup_point}</p>
                    <p className="text-sm text-gray-600">From: {new Date(booking.available_from).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">To: {new Date(booking.available_to).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Price: ₹{parseFloat(booking.price_per_hour).toFixed(2)}/hour</p>
                    <p className="text-sm text-gray-600 mb-2">Booked: {new Date(booking.booked_at).toLocaleString()}</p>
                    <button
                      onClick={() => handleCancelVehicleBooking(booking.id)}
                      className="text-sm text-red-600 hover:underline transition"
                    >
                      Cancel Booking
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">You haven&apos;t booked any vehicles yet.</p>
              )}
            </div>
          </section>
        </div>
        
        {/* Create Vehicle and Post Availability Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Create Vehicle Section */}
          <section className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Add New Vehicle</h2>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Vehicle Name (e.g., Honda City)"
                value={newVehicleForm.name}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                required
              />
              <input
                type="text"
                name="registration_number"
                placeholder="Registration Number"
                value={newVehicleForm.registration_number}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, registration_number: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                required
              />
              <input
                type="number"
                name="price_per_hour"
                placeholder="Default Price per Hour (₹)"
                value={newVehicleForm.price_per_hour}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, price_per_hour: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                required
              />
              <input
                type="datetime-local"
                name="available_from"
                value={newVehicleForm.available_from}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, available_from: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
                required
              />
              <input
                type="datetime-local"
                name="available_to"
                value={newVehicleForm.available_to}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, available_to: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-full font-semibold shadow hover:bg-green-700 transition"
              >
                Add Vehicle
              </button>
            </form>
          </section>

          {/* Post Vehicle Availability Section */}
          <section className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Post Vehicle Availability</h2>
            <form onSubmit={handleCreateAvailability} className="space-y-4">
              <select
                name="vehicle_id"
                value={newAvailabilityForm.vehicle_id}
                onChange={(e) => setNewAvailabilityForm({ ...newAvailabilityForm, vehicle_id: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
                required
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.registration_number}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="pickup_point"
                placeholder="Pickup Point"
                value={newAvailabilityForm.pickup_point}
                onChange={(e) => setNewAvailabilityForm({ ...newAvailabilityForm, pickup_point: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                required
              />
              <input
                type="datetime-local"
                name="available_from"
                value={newAvailabilityForm.available_from}
                onChange={(e) => setNewAvailabilityForm({ ...newAvailabilityForm, available_from: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
                required
              />
              <input
                type="datetime-local"
                name="available_to"
                value={newAvailabilityForm.available_to}
                onChange={(e) => setNewAvailabilityForm({ ...newAvailabilityForm, available_to: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
                required
              />
              <input
                type="number"
                name="price_per_hour"
                placeholder="Price per Hour (₹)"
                value={newAvailabilityForm.price_per_hour}
                onChange={(e) => setNewAvailabilityForm({ ...newAvailabilityForm, price_per_hour: e.target.value })}
                className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold shadow hover:bg-blue-700 transition"
              >
                Post Availability
              </button>
            </form>
          </section>
        </div>

        {/* Chatbot and OBD Sections - using the /chatbot and /obd/mock endpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Chatbot Section */}
            <section className="bg-white p-8 rounded-3xl shadow-xl flex flex-col h-96">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">UniPool Assistant</h2>
                    <p className="text-gray-600 text-sm">
                        🚗 No more customer service calls! Your personalized AI assistant is here to help with ride bookings, 
                        vehicle queries, and everything UniPool. Ask me anything!
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-xl bg-gray-50 space-y-4">
                    {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-green-200 text-gray-800' : 'bg-gray-200 text-gray-700'}`}>
                                {msg.isFormatted ? (
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: msg.text }}
                                        className="formatted-response"
                                    />
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-1 border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                    />
                    <button type="submit" className="bg-green-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-green-700 transition">
                        Send
                    </button>
                </form>
            </section>

            {/* OBD Mock Data Section */}
            <section className="bg-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">OBD  Data</h2>
                    <p className="text-gray-600 mb-4">
                        Simulate real-time data from a vehicle&apos;s On-Board Diagnostics system.
                        <br />
                        <span className="text-sm text-gray-500">
                            This generates mock sensor data (speed, RPM, fuel level, GPS) for testing.
                        </span>
                    </p>
                    
                    <button
                        onClick={handleCreateTestVehicle}
                        className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold shadow hover:bg-blue-700 transition mb-4"
                    >
                        Create Test Vehicle
                    </button>
                    
                    <input
                        type="text"
                        value={obdVehicleId}
                        onChange={(e) => setObdVehicleId(e.target.value)}
                        placeholder="Vehicle ID (auto-filled after creating test vehicle)"
                        className="w-full border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 mb-4"
                    />
                    <div className="space-y-3">
                        <button
                            onClick={handleMockOBD}
                            className="w-full bg-green-600 text-white py-3 rounded-full font-semibold shadow hover:bg-green-700 transition"
                        >
                            Generate & View OBD Data
                        </button>
                        {obdVehicleId && (
                            <button
                                onClick={fetchOBDData}
                                className="w-full bg-gray-500 text-white py-2 rounded-full font-medium shadow hover:bg-gray-600 transition text-sm"
                            >
                                Refresh Data
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </div>

        {/* OBD Data Display Section */}
        {obdData.length > 0 && (
          <section className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Recent OBD Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {obdData.map((record, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-2xl shadow-md border-l-4 border-purple-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-purple-700">Record #{index + 1}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-semibold text-blue-600">
                        {record.speed ? `${record.speed.toFixed(1)} km/h` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">RPM:</span>
                      <span className="font-semibold text-green-600">
                        {record.rpm ? `${record.rpm}` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Level:</span>
                      <span className="font-semibold text-orange-600">
                        {record.fuel_level ? `${record.fuel_level.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    
                    {record.error_code && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Error:</span>
                        <span className="font-semibold text-red-600">{record.error_code}</span>
                      </div>
                    )}
                    
                    {record.location_lat && record.location_lng && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600">Location:</div>
                        <div className="text-xs text-gray-500">
                          Lat: {record.location_lat.toFixed(4)}, Lng: {record.location_lng.toFixed(4)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {obdData.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No OBD data available. Push some mock data first!
              </p>
            )}
          </section>
        )}
      </main>

      {/* Liability Agreement Modal */}
      {showLiabilityModal && selectedAvailability && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Liability & Usage Agreement
              </h2>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-green-700">
                  {selectedAvailability.vehicle_name}
                </h3>
                <p className="text-gray-600">
                  Pickup: {selectedAvailability.pickup_point}
                </p>
                <p className="text-gray-600">
                  Duration: {new Date(selectedAvailability.available_from).toLocaleString()} - {new Date(selectedAvailability.available_to).toLocaleString()}
                </p>
                <p className="text-gray-600 font-semibold">
                  Price: ₹{parseFloat(selectedAvailability.price_per_hour).toFixed(2)}/hour
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-2xl mb-6 text-sm text-gray-700 leading-relaxed">
                <h4 className="font-bold text-lg mb-4 text-gray-800">UniPool Liability Agreement</h4>
                <p className="mb-4">
                  By booking a ride through UniPool, you agree to the following:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Responsibility for Damages:</h5>
                    <p>You are solely responsible for any damage caused to the vehicle during your ride. You agree to bear all repair or replacement costs arising from such damages.</p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Prohibited Activities:</h5>
                    <p>You must not tamper with, misuse, or interfere with any vehicle parts or installed devices. This includes, but is not limited to, attempts to disable or manipulate the On-Board Diagnostics (OBD) tracker.</p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Monitoring & Accountability:</h5>
                    <p>The vehicle is monitored through the OBD tracker for safety and security. Any unfair, illegal, or suspicious activity will be logged, and you may face penalties or legal action.</p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Acceptance of Terms:</h5>
                    <p>By clicking "I Agree" and proceeding with your booking, you acknowledge that you have read, understood, and accepted these terms. If you do not agree, you cannot book a ride through UniPool.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowLiabilityModal(false);
                    setSelectedAvailability(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-full font-semibold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptLiability}
                  className="flex-1 bg-green-600 text-white py-3 rounded-full font-semibold hover:bg-green-700 transition"
                >
                  I Agree & Book Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
