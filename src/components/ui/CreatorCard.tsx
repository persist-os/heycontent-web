'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CreatorCardProps {
  name: string;
  title: string;
  joinDate: string;
  inviteCode: string;
  invitesLeft: number;
  onShare: () => void;
}

export const CreatorCard = ({
  name,
  title,
  joinDate,
  inviteCode,
  invitesLeft,
  onShare
}: CreatorCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const gradientColors = [
    'from-emerald-400 to-indigo-600',
    'from-purple-400 to-pink-600',
    'from-blue-400 to-emerald-600'
  ];

  const randomGradient = gradientColors[Math.floor(Math.random() * gradientColors.length)];

  return (
    <div className="max-w-md mx-auto p-4">
      <motion.div
        className={`relative aspect-[3/4] rounded-2xl p-6 bg-gradient-to-br ${randomGradient} shadow-xl cursor-pointer`}
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onShare}
      >
        <div className="absolute inset-0 bg-black/10 rounded-2xl" />
        
        <div className="relative h-full flex flex-col justify-between text-white">
          <div>
            <h2 className="text-3xl font-bold mb-2">{name}</h2>
            <p className="text-xl opacity-90">{title}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-black/20 px-4 py-2 rounded-full">
                <span className="uppercase text-sm font-medium">HeyContent</span>
              </div>
              <div className="bg-black/20 px-4 py-2 rounded-full">
                <span className="text-sm">{joinDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm opacity-90">Your Invite Code:</p>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <code className="text-lg font-mono">{inviteCode}</code>
              </div>
              <p className="text-sm opacity-75">
                {invitesLeft} invite{invitesLeft !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
        </div>

        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-sm"
          >
            <div className="text-white text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <p className="text-lg font-medium">Share Your Card</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}; 