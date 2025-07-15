'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { RecentSignup } from './RecentSignup';
import { WaitlistSignup } from '../types';

// Mock data for when there are no real signups yet
const MOCK_SIGNEES = [
  { id: '1', name: 'Sarah', timestamp: Date.now() - 1000 * 60 * 5 },
  { id: '2', name: 'Alex', timestamp: Date.now() - 1000 * 60 * 15 },
  { id: '3', name: 'Jordan', timestamp: Date.now() - 1000 * 60 * 30 },
  { id: '4', name: 'Taylor', timestamp: Date.now() - 1000 * 60 * 60 },
  { id: '5', name: 'Casey', timestamp: Date.now() - 1000 * 60 * 120 },
];

export const RecentSignups = () => {
  // Fetch real signups from Convex
  const recentSignups = useQuery(api.waitlist.getRecentSignups, { limit: 5 }) || [];
  const [signups, setSignups] = useState<WaitlistSignup[]>([]);
  const [showRealData, setShowRealData] = useState(false);

  // Use mock data if no real data is available yet
  useEffect(() => {
    if (recentSignups.length > 0) {
      setSignups(recentSignups);
      setShowRealData(true);
    } else {
      setSignups(MOCK_SIGNEES);
    }
  }, [recentSignups]);

  // Rotate through mock data to make it feel alive
  useEffect(() => {
    if (!showRealData) {
      const interval = setInterval(() => {
        setSignups(prev => {
          const newSignups = [...prev];
          // Remove the oldest and add a new one
          newSignups.pop();
          const newSignup = {
            ...MOCK_SIGNEES[Math.floor(Math.random() * MOCK_SIGNEES.length)],
            id: Date.now().toString(),
            timestamp: Date.now(),
          };
          return [newSignup, ...newSignups];
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showRealData]);

  return (
    <div className="max-w-md mx-auto mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="relative flex h-3 w-3 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
        </span>
        Recent Signups
      </h3>
      
      <div className="space-y-2">
        <AnimatePresence>
          {signups.map((signup, index) => (
            <RecentSignup
              key={signup.id}
              name={signup.name}
              timeAgo={formatDistanceToNow(new Date(signup.timestamp), { addSuffix: true })}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecentSignups;
