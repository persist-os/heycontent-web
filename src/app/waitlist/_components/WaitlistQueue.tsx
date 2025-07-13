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
          setError(result.message || 'Failed to join beta program.');
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
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">🚀 Beta Program</h2>
          <p className="text-xl text-foreground mb-2">Get early access to creator tools</p>
          <p className="text-base text-muted-foreground">Join our exclusive beta testing program for creators</p>
        </div>
        <div className="bg-background/90 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 pl-11 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
                  required
                  placeholder="Enter your name"
                  title="Full name"
                />
                <User className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-11 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
                  required
                  placeholder="Enter your email"
                  title="Email address"
                />
                <Mail className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={false}
            >
              Join Beta Program
            </button>
          </form>
        </div>
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
            Your Beta Access is Reserved
          </h2>
        </div>
        <div className="bg-background rounded-2xl shadow-xl px-10 py-10 border border-border flex flex-col items-center w-full">
          <p className="text-xl text-foreground mb-2 text-center font-medium">
            {currentPosition === 1 ? 'Beta tester' : 'Beta testers'} ahead of you
          </p>
          <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 tracking-tight">
            {currentPosition}
          </div>
          <div className="text-base text-muted-foreground text-center font-medium mb-4">
            Your Queue ID: <span className="text-foreground break-all">{queueId}</span>
          </div>
          <div className="relative h-3 w-full bg-muted rounded-full mb-8 overflow-hidden max-w-lg">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${100 - (currentPosition / position) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-base shadow-lg">
              β
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
            <div className="bg-background p-6 rounded-xl shadow-sm border border-border flex flex-col items-center text-center max-w-xs mx-auto">
              <CheckCircle className="w-7 h-7 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-full p-1 mb-3" />
              <h3 className="font-semibold text-foreground text-lg mb-2">Stay on One Device</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Keep this browser window open on your current device to maintain your beta access position.</p>
            </div>
            <div className="bg-background p-6 rounded-xl shadow-sm border border-border flex flex-col items-center text-center max-w-xs mx-auto">
              <PlusCircle className="w-7 h-7 text-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded-full p-1 mb-3" />
              <h3 className="font-semibold text-foreground text-lg mb-2">Single Tab Only</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Please don't open multiple tabs to avoid losing your spot in the beta queue.</p>
            </div>
            <div className="bg-background p-6 rounded-xl shadow-sm border border-border flex flex-col items-center text-center max-w-xs mx-auto">
              <Lock className="w-7 h-7 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-full p-1 mb-3" />
              <h3 className="font-semibold text-foreground text-lg mb-2">Beta Detection Active</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Our system is monitoring for automated access attempts to protect beta slots.</p>
            </div>
          </div>
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
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">🎉 Welcome to Beta!</h2>
          <p className="text-xl text-foreground mb-2">You're now part of our exclusive beta program!</p>
          <p className="text-base text-muted-foreground">Your early access credentials will be sent to your email.</p>
        </div>
        <CreatorCard
          name={name}
          onShareAction={onQueueCompleteAction}
        />
      </div>
    );
  }

  return null;
}; 