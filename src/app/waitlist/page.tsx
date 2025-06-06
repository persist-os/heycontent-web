'use client';

import React, { useState } from 'react';
import { WaitlistQueue } from './_components/WaitlistQueue';
import { CreatorCard } from './_components/CreatorCard';
import { motion, AnimatePresence } from 'framer-motion';

const generateQueueId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateCreativeTitle = (name: string) => {
  const titles = [
    'Creative Alchemist',
    'Momentum Builder',
    'Content Visionary',
    'Digital Storyteller',
    'Brand Architect'
  ];
  return titles[Math.floor(Math.random() * titles.length)];
};

export default function WaitlistPage() {
  const [stage, setStage] = useState<'queue' | 'card'>('queue');
  const [queueId] = useState(generateQueueId());
  const [name, setName] = useState('');

  const handleQueueComplete = (userName?: string) => {
    if (userName) setName(userName);
    setStage('card');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`Join me on HeyContent!`);
      alert('Invite link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <AnimatePresence mode="wait">
        {stage === 'queue' ? (
          <motion.div
            key="queue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WaitlistQueue
              position={20}
              queueId={queueId}
              onQueueComplete={handleQueueComplete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CreatorCard
              name={name || 'Creator'}
              title={generateCreativeTitle(name)}
              joinDate={new Date().toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
              onShare={handleShare}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 