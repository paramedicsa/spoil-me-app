import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-cyan-400">Terms and Conditions</h1>
        <div className="space-y-6 text-gray-300">
          <p>
            Welcome to Spoil Me. These terms and conditions outline the rules and regulations for the use of Spoil Me's Website, located at spoilme.com.
          </p>
          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use Spoil Me if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          <h2 className="text-2xl font-semibold text-cyan-400 mt-4">Cookies</h2>
          <p>
            We employ the use of cookies. By accessing Spoil Me, you agreed to use cookies in agreement with the Spoil Me's Privacy Policy.
          </p>
          <h2 className="text-2xl font-semibold text-cyan-400 mt-4">License</h2>
          <p>
            Unless otherwise stated, Spoil Me and/or its licensors own the intellectual property rights for all material on Spoil Me. All intellectual property rights are reserved. You may access this from Spoil Me for your own personal use subjected to restrictions set in these terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;

