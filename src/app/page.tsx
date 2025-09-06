"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

// Make sure you have the hero-illustration.png file in your public directory.
// You can replace it with any other suitable image.

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="bg-green-50 font-sans min-h-screen flex flex-col antialiased text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-green-700">UniPool</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/login")}
              className="px-5 py-2.5 text-green-700 font-semibold rounded-full border border-green-700 hover:bg-green-50 transition-all duration-300 ease-in-out"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="px-5 py-2.5 bg-green-700 text-white font-semibold rounded-full hover:bg-green-800 transition-all duration-300 ease-in-out shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-white max-w-7xl mx-auto mt-12 mb-16 p-8 md:p-12 rounded-3xl shadow-2xl flex flex-col-reverse md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-5xl md:text-6xl font-extrabold text-green-800 leading-tight mb-6">
              Ride Smarter, <br /> Travel Safer.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              UniPool is a university-exclusive ride-sharing platform designed to make campus travel convenient, affordable, and secure. Find rides, share your journey, and connect with fellow students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/signup")}
                className="bg-green-700 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Get Started
              </button>
              <button
                onClick={() => router.push("/login")}
                className="bg-gray-100 text-gray-800 px-8 py-3 rounded-full font-semibold text-lg border border-gray-300 hover:bg-gray-200 transition-all duration-300 ease-in-out"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="flex-1 w-full md:w-auto">
            <div className="relative w-full h-64 md:h-96">
              <Image
                src="/uni.gif"
                alt="UniPool Illustration"
                layout="fill"
                objectFit="contain"
                className="rounded-2xl"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-6">The Problem</h3>
          <p className="text-gray-600 text-lg text-center leading-relaxed max-w-3xl mx-auto">
            University students often face high travel costs, limited transport options, and safety concerns when commuting. Public transport is unreliable, personal cars are expensive, and finding trustworthy carpool options is a challenge.
          </p>
        </section>

        {/* Why Choose Us */}
        <section className="bg-white max-w-7xl mx-auto px-8 py-16 rounded-3xl shadow-xl mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose UniPool?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl shadow-md border-t-4 border-green-600 transition-all duration-300 hover:shadow-lg">
              <h4 className="text-2xl font-semibold mb-3 text-green-700">Safe & Verified</h4>
              <p className="text-gray-600">
                All users are verified university students, creating a secure and trusted community for every ride. We prioritize your safety above all else.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl shadow-md border-t-4 border-green-600 transition-all duration-300 hover:shadow-lg">
              <h4 className="text-2xl font-semibold mb-3 text-green-700">Affordable & Efficient</h4>
              <p className="text-gray-600">
                Share travel costs and enjoy convenient scheduling that fits your academic timetable, making your commute both budget-friendly and hassle-free.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl shadow-md border-t-4 border-green-600 transition-all duration-300 hover:shadow-lg">
              <h4 className="text-2xl font-semibold mb-3 text-green-700">Eco-Friendly</h4>
              <p className="text-gray-600">
                Contribute to a greener campus by reducing the number of cars on the road and lowering your carbon footprint with every shared ride.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-500 text-center py-8">
        <p className="text-sm">&copy; {new Date().getFullYear()} UniPool. All rights reserved.</p>
      </footer>
    </div>
  );
}