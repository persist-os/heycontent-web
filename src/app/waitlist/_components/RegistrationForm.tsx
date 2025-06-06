import React from 'react';
import { RegistrationFormProps } from '../types';

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  name,
  email,
  onNameChange,
  onEmailChange,
}) => {
  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join the Waitlist</h1>
        <p className="text-gray-600">Be the first to know when we launch!</p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        >
          Join Waitlist
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Join {Math.floor(Math.random() * 1000) + 500} others on the waitlist!
        </p>
      </div>
    </div>
  );
};

export default RegistrationForm;
