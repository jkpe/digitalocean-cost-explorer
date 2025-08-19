import React from 'react';
import LiveDropletCosts from './LiveDropletCosts';

const LiveDropletDashboard = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">DigitalOcean Droplet Costs</h1>
          <p className="text-gray-600">View and analyze your Droplet costs by region, tag, and more.</p>
        </div>
        
        <LiveDropletCosts />
      </div>
      
      <footer className="mt-8 mb-8 pb-6 text-center text-sm text-gray-500 px-4 mx-auto" style={{ maxWidth: '39rem' }}>
        <p>
          Version 0.2.0-beta<br />
          <a href="https://forms.gle/q8FdoHWSVC4k4xPD7" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Submit feedback</a><br />
          <br />
          This is <strong>not</strong> an official DigitalOcean app<br />
          Thoughtfully crafted by <a href="https://www.jackpearce.co.uk/" target="_blank" rel="noopener noreferrer"><strong>Jack Pearce</strong></a>, I hope you found it useful ❤️.
        </p>
      </footer>
    </div>
  );
};

export default LiveDropletDashboard; 