import React from 'react';
import UrlShortener from '../components/UrlShortener';
import { ChartBarIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Shorten Your URLs,<br />
          <span className="text-blue-600">Amplify Your Reach</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Create short, memorable links and track their performance with detailed analytics.
          Free to use, no registration required.
        </p>
      </div>

      {/* URL Shortener Form */}
      <UrlShortener />

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 py-12">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <GlobeAltIcon className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Fast & Reliable</h3>
          <p className="text-sm text-gray-600">
            Lightning-fast URL shortening with 99.9% uptime guarantee
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <ChartBarIcon className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
          <p className="text-sm text-gray-600">
            Track clicks, locations, and devices with real-time analytics
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <ShieldCheckIcon className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Secure & Private</h3>
          <p className="text-sm text-gray-600">
            Your data is encrypted and protected with enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;