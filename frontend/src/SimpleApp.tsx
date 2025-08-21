import React from 'react';

function SimpleApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">URL Shortener Test</h1>
      <p className="text-gray-600">If you see this, React and Tailwind are working!</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Test Button
      </button>
    </div>
  );
}

export default SimpleApp;