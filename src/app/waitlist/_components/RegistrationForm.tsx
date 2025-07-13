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
    <div className="max-w-md mx-auto bg-background/90 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-border">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Join Beta Program</h1>
        <p className="text-muted-foreground">Get early access to creator tools and mobile features!</p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200 placeholder-muted-foreground"
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200 placeholder-muted-foreground"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Join Beta Program
        </button>
      </form>
      
    </div>
  );
};

export default RegistrationForm;
