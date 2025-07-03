'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreatorCard } from './CreatorCard';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RegistrationForm } from './RegistrationForm';
import { User, Mail, CheckCircle, PlusCircle, Lock } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface WaitlistQueueProps {
  position: number;
  queueId: string;
  onQueueCompleteAction?: () => void;
  onStageChangeAction?: (stage: 'register' | 'queue' | 'card') => void;
}

export const WaitlistQueue = ({ position, queueId, onQueueCompleteAction, onStageChangeAction }: WaitlistQueueProps) => {
  const [stage, setStage] = useState<'register' | 'queue' | 'card'>('register');
  const [currentPosition, setCurrentPosition] = useState(position);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const addToWaitlist = useMutation(api.waitlist.add);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    function tick() {
      setCurrentPosition(prev => {
        if (prev <= 0) return prev;
        // 80% chance to decrement by 1, 20% by 2 (but never below 0)
        const decrement = Math.random() < 0.2 ? 2 : 1;
        return Math.max(0, prev - decrement);
      });
      // Random delay between 1s and 3.5s for next tick
      const nextDelay = 1000 + Math.random() * 2500;
      timeout = setTimeout(tick, nextDelay);
    }
    if (stage === 'queue') {
      timeout = setTimeout(tick, 1200 + Math.random() * 1200); // first tick a bit random
    }
    return () => clearTimeout(timeout);
  }, [stage]);

  useEffect(() => {
    if (stage === 'queue' && currentPosition <= 0) {
      setStage('card');
      onQueueCompleteAction?.();
    }
  }, [currentPosition, onQueueCompleteAction, stage]);

  useEffect(() => {
    onStageChangeAction?.(stage);
  }, [stage, onStageChangeAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (email && name) {
      try {
        const result = await addToWaitlist({ name, email });
        if (result.success) {
          setStage('queue');
        } else {
          setError(result.message || 'Failed to join waitlist.');
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  if (stage === 'register') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Logo className="h-12 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
            Get Early Access
          </h2>
          <p className="text-xl text-gray-700 mb-2">
            Sign up to secure your spot
          </p>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  placeholder="Enter your name"
                  title="Full name"
                />
                <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  placeholder="Enter your email"
                  title="Email address"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={false}
            >
              Join Waitlist
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (stage === 'card') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Logo className="h-12 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">🎉 You're In!</h2>
          <p className="text-xl text-gray-700 mb-2">Welcome to the HeyContent family!</p>
          <p className="text-base text-gray-500">Your exclusive access code will be sent to your email.</p>
        </div>
        <CreatorCard
          name={name}
          onShareAction={onQueueCompleteAction}
        />
      </div>
    );
  }

  if (stage === 'queue') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Logo className="h-12 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            Your Spot is Reserved
          </h2>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl px-10 py-10 border border-gray-100 flex flex-col items-center w-full">
          <p className="text-xl text-gray-700 mb-2 text-center font-medium">
            {currentPosition === 1 ? 'Person' : 'People'} ahead of you
          </p>
          <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 tracking-tight">
            {currentPosition}
          </div>
          <div className="text-base text-gray-500 text-center font-medium mb-4">
            Your Queue ID: <span className="text-gray-700 break-all">{queueId}</span>
          </div>
          <div className="relative h-3 w-full bg-gray-100 rounded-full mb-8 overflow-hidden max-w-lg">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${100 - (currentPosition / position) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-base shadow-lg">
              i
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center max-w-xs mx-auto">
              <CheckCircle className="w-7 h-7 text-blue-500 bg-blue-50 rounded-full p-1 mb-3" />
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Stay on One Device</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Keep this browser window open on your current device to maintain your position.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center max-w-xs mx-auto">
              <PlusCircle className="w-7 h-7 text-purple-500 bg-purple-50 rounded-full p-1 mb-3" />
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Single Tab Only</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Please don't open multiple tabs to avoid losing your spot in line.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center max-w-xs mx-auto">
              <Lock className="w-7 h-7 text-indigo-500 bg-indigo-50 rounded-full p-1 mb-3" />
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Security Active</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Our system is monitoring for automated access attempts.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-10">
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 2, 0, -2, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Logo className="h-12 mx-auto mb-4" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Spot is Reserved</h1>
        <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 my-6">{currentPosition}</div>
        <p className="text-xl text-gray-600 font-medium">
          {currentPosition === 1 ? 'Person' : 'People'} ahead of you
        </p>
      </div>

      <div className="relative h-3 bg-gray-100 rounded-full mb-10 overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${100 - (currentPosition / position) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg">
          i
        </div>
      </div>

      <div className="text-sm text-gray-500 text-center font-medium mb-10">
        Your Queue ID: <span className="text-gray-700">{queueId}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Stay on One Device</h3>
          </div>
          <p className="text-sm text-gray-600">Keep this browser window open on your current device to maintain your position.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Single Tab Only</h3>
          </div>
          <p className="text-sm text-gray-600">Please don't open multiple tabs to avoid losing your spot in line.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Security Active</h3>
          </div>
          <p className="text-sm text-gray-600">Our system is monitoring for automated access attempts.</p>
        </div>
      </div>
    </div>
  );
}; 