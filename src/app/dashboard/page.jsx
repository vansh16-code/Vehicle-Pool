"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// Helper function to get the base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [newRideForm, setNewRideForm] = useState({
    source: "",
    destination: "",
    departure_time: "",
    fare: "",
    available_seats: "",
  });
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
        ridesRes,
        myRidesRes,
        myBookingsRes,
      ] = await Promise.all([
        axios.get(`${API_URL}/api/me`), // Corresponds to the "/me" endpoint
        axios.get(`${API_URL}/api/rides`), // Corresponds to the "/rides" endpoint
        axios.get(`${API_URL}/api/my-rides`), // Corresponds to the "/my-rides" endpoint
        axios.get(`${API_URL}/api/my-bookings`), // Corresponds to the "/my-bookings" endpoint
      ]);

      setUser(userRes.data);
      setRides(ridesRes.data);
      setMyRides(myRidesRes.data);
      setMyBookings(myBookingsRes.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Please try logging in again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = async (e) => {
    e.preventDefault();
    try {
      // 3. Create a new ride via the "POST /rides" endpoint
      await axios.post(`${API_URL}/api/rides`, newRideForm);
      setNewRideForm({
        source: "",
        destination: "",
        departure_time: "",
        fare: "",
        available_seats: "",
      });
      fetchData(); // Refresh data after creating
    } catch (err) {
      setError("Failed to create ride.");
    }
  };

  const handleBookRide = async (rideId) => {
    try {
      // 4. Book a ride using "POST /rides/{ride_id}/book"
      await axios.post(`${API_URL}/api/rides/${rideId}/book`);
      fetchData(); // Refresh data
      setError("Ride booked successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to book ride.");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      // 5. Cancel a booking using "DELETE /bookings/{booking_id}/cancel"
      await axios.delete(`${API_URL}/api/bookings/${bookingId}/cancel`);
      fetchData(); // Refresh data
      setError("Booking cancelled successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to cancel booking.");
    }
  };

  const handleDeleteRide = async (rideId) => {
    if (!confirm("Are you sure you want to delete this ride? This action cannot be undone.")) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/rides/${rideId}`);
      fetchData(); // Refresh data
      setError("Ride deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete ride.");
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

        {/* Available Rides Section - uses the /rides endpoint */}
        <section className="bg-white p-8 rounded-3xl shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Available Rides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.length > 0 ? (
              rides.map((ride) => (
                <div key={ride.id} className="bg-gray-50 p-6 rounded-2xl shadow-md border-t-4 border-green-600">
                  <h3 className="text-xl font-semibold mb-2 text-green-700">{ride.source} → {ride.destination}</h3>
                  <p className="text-sm text-gray-600 mb-1">Driver: {ride.driver}</p>
                  <p className="text-sm text-gray-600 mb-1">Departure: {new Date(ride.departure_time).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mb-1">Seats: {ride.available_seats}</p>
                  <p className="text-sm text-gray-600 mb-4">Fare: ₹{parseFloat(ride.fare).toFixed(2)}</p>
                  <button
                    onClick={() => handleBookRide(ride.id)}
                    className="w-full bg-green-600 text-white py-2 rounded-full font-semibold hover:bg-green-700 transition"
                  >
                    Book Ride
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No available rides at the moment.</p>
            )}
          </div>
        </section>

        {/* My Rides & Bookings - uses the /my-rides and /my-bookings endpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* My Rides Section */}
          <section className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My Rides (As Driver)</h2>
            <div className="space-y-4">
              {myRides.length > 0 ? (
                myRides.map((ride) => (
                  <div key={ride.id} className="bg-gray-50 p-6 rounded-2xl shadow-sm border-l-4 border-green-600">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-700">{ride.source} → {ride.destination}</h3>
                        <p className="text-sm text-gray-600">Departure: {new Date(ride.departure_time).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Fare: ₹{parseFloat(ride.fare).toFixed(2)} | Seats: {ride.available_seats}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteRide(ride.id)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">You haven&apos;t created any rides yet.</p>
              )}
            </div>
          </section>

          {/* My Bookings Section */}
          <section className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My Bookings</h2>
            <div className="space-y-4">
              {myBookings.length > 0 ? (
                myBookings.map((booking) => (
                  <div key={booking.booking_id} className="bg-gray-50 p-6 rounded-2xl shadow-sm border-l-4 border-green-600">
                    <h3 className="text-lg font-semibold text-green-700">{booking.source} → {booking.destination}</h3>
                    <p className="text-sm text-gray-600">Driver: {booking.driver}</p>
                    <p className="text-sm text-gray-600 mb-2">Departure: {new Date(booking.departure_time).toLocaleString()}</p>
                    <button
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      className="text-sm text-red-600 hover:underline transition"
                    >
                      Cancel Booking
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">You haven&apos;t booked any rides yet.</p>
              )}
            </div>
          </section>
        </div>
        
        {/* Create a Ride Section - uses the POST /rides endpoint */}
        <section className="bg-white p-8 rounded-3xl shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Create a New Ride</h2>
          <form onSubmit={handleCreateRide} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              name="source"
              placeholder="Source"
              value={newRideForm.source}
              onChange={(e) => setNewRideForm({ ...newRideForm, source: e.target.value })}
              className="border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
              required
            />
            <input
              type="text"
              name="destination"
              placeholder="Destination"
              value={newRideForm.destination}
              onChange={(e) => setNewRideForm({ ...newRideForm, destination: e.target.value })}
              className="border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
              required
            />
            <input
              type="datetime-local"
              name="departure_time"
              value={newRideForm.departure_time}
              onChange={(e) => setNewRideForm({ ...newRideForm, departure_time: e.target.value })}
              className="border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
              required
            />
            <input
              type="number"
              name="fare"
              placeholder="Fare (₹)"
              value={newRideForm.fare}
              onChange={(e) => setNewRideForm({ ...newRideForm, fare: e.target.value })}
              className="border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
              required
            />
            <input
              type="number"
              name="available_seats"
              placeholder="Available Seats"
              value={newRideForm.available_seats}
              onChange={(e) => setNewRideForm({ ...newRideForm, available_seats: e.target.value })}
              className="border border-gray-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-full font-semibold shadow hover:bg-green-700 transition"
            >
              Create Ride
            </button>
          </form>
        </section>

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
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">OBD Mock Data</h2>
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
    </div>
  );
}
