'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WaitlistQueueProps {
  position: number;
  queueId: string;
  onQueueComplete?: () => void;
}

export const WaitlistQueue = ({ position, queueId, onQueueComplete }: WaitlistQueueProps) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  
  useEffect(() => {
    // Simulate queue movement (replace with real queue logic)
    const interval = setInterval(() => {
      if (currentPosition > 0) {
        setCurrentPosition(prev => prev - 1);
      } else {
        onQueueComplete?.();
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPosition, onQueueComplete]);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">YOU ARE NOW IN THE QUEUE</h1>
        <div className="text-6xl font-bold text-blue-600 my-6">{currentPosition}</div>
        <p className="text-gray-600 uppercase">
          {currentPosition === 1 ? 'PERSON' : 'PEOPLE'} AHEAD OF YOU
        </p>
      </div>

      <div className="relative h-2 bg-gray-200 rounded-full mb-8">
        <motion.div
          className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${100 - (currentPosition / position) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
          i
        </div>
      </div>

      <div className="text-sm text-gray-500 text-center">
        QUEUE ID: {queueId}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold">Stick To One Device</h3>
          </div>
          <p className="text-sm text-gray-600">Join the queue from one browser on one device. Additional attempts could result in losing your place.</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="font-semibold">One Tab Only</h3>
          </div>
          <p className="text-sm text-gray-600">Multiple tabs may cause you to lose your place in line.</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="font-semibold">Bot Detection Is Live</h3>
          </div>
          <p className="text-sm text-gray-600">Disable any browser extensions that may cause you to be flagged as a bot.</p>
        </div>
      </div>
    </div>
  );
}; 