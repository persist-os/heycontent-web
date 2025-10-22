import React from 'react';
import { User, AtSign, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { T } from '@/components/translation';

interface BasicInfoStepProps {
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  email: string;
  setEmail: (email: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  name,
  setName,
  username,
  setUsername,
  email,
  setEmail,
  onNext,
  onPrevious
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
          <T context="label.auth.full-name">Full Name</T>
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
            required
            placeholder="Enter your full name"
          />
          <User className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
          <T context="label.auth.username">Username</T>
        </label>
        <div className="relative">
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
            required
            placeholder="Choose a username"
          />
          <AtSign className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          <T context="label.auth.email">Email</T>
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
            required
            placeholder="Enter your email"
          />
          <Mail className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onPrevious}
          className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl hover:bg-secondary/80 transition-colors font-medium flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <T context="button.auth.back">Back</T>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!name.trim() || !username.trim() || !email.trim()}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
        >
          <T context="button.auth.continue">Continue</T>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default BasicInfoStep;
