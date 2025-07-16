'use client';
import Image from "next/image";
import Link from "next/link";
import HeroImage from "@/public/hero.png";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { useRouter } from 'next/navigation';

export function Hero() {
 
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-indigo-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-100 rounded-full opacity-15 blur-2xl"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* App Name */}
        <h1 className="text-6xl md:text-8xl font-bold text-gray-800 mb-8 tracking-tight">
          Accounting Ko
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-12 font-light">
          Your Simple Accounting Solution
        </p>
        
        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
          Login
        </button>
        
        {/* Optional small text */}
        <p className="text-gray-500 mt-8 text-sm">
          Manage your finances with ease
        </p>
      </div>
    </div>
    );
}