"use client";

import { useState, type ChangeEvent } from "react";
import axios, { type AxiosError } from "axios";

export default function SignupPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    university_id: "",
    phone_number: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/signup`, form);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
        const errorData = axiosError.response.data as { detail?: string };
        setError(errorData.detail || "Signup failed. Please try again.");
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center px-4 font-sans antialiased relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Sign Up Card */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 sm:p-10 relative z-10 transform transition-all duration-300 hover:scale-[1.01]">
        <div className="flex justify-center mb-6">
          <h1 className="text-4xl font-extrabold text-green-700">UniPool</h1>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Create Your Account</h2>
        <p className="text-gray-500 text-center mb-8">Join our secure ride-sharing community.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm" role="alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Username Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300 placeholder-gray-500"
              required
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.67A2 2 0 0012 15a2 2 0 001.11-.33L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="email"
              name="email"
              placeholder="University Email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300 placeholder-gray-500"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11H9V7a3 3 0 013-3h1a3 3 0 013 3v4h-2a2 2 0 00-2 2z" />
              </svg>
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300 placeholder-gray-500"
              required
            />
          </div>

          {/* University ID Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.417a4.99 4.99 0 01-.067-1.353l-6.108-3.417zM12 14l-6.16-3.417a4.99 4.99 0 00-.067-1.353l6.108-3.417z" />
              </svg>
            </div>
            <input
              type="text"
              name="university_id"
              placeholder="University ID"
              value={form.university_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300 placeholder-gray-500"
              required
            />
          </div>

          {/* Phone Number Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.293a1 1 0 01.707.293l3.586 3.586a1 1 0 010 1.414L9.414 11l3.586 3.586a1 1 0 010 1.414l-3.586 3.586a1 1 0 01-.707.293H5a2 2 0 01-2-2v-3.586a1 1 0 01-.293-.707l-.707-.707a1 1 0 010-1.414l.707-.707A1 1 0 013.293 11H5z" />
              </svg>
            </div>
            <input
              type="text"
              name="phone_number"
              placeholder="Phone Number"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300 placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-full font-semibold shadow-md transition-all duration-300 ease-in-out
              ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'}`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => {
              window.location.href = "/login";
            }}
            className="text-green-600 font-semibold cursor-pointer hover:underline transition-colors"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
