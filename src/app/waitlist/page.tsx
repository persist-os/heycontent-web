'use client';

import React, { useState } from 'react';
import { WaitlistQueue } from './_components/WaitlistQueue';
import { CreatorCard } from './_components/CreatorCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/ui/logo';

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
  const [name, setName] = useState('');
  const [position] = useState(() => {
    const base = Math.floor(Math.random() * 41) + 10;
    return base + Math.floor(Math.random() * 3) - 1;
  });
  const [queueId] = useState(generateQueueId());

  const handleQueueComplete = (userName?: string) => {
    if (userName) setName(userName);
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
    <div className="min-h-screen bg-gradient-to-b from-background/80 via-muted/20 to-background/80">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!name ? (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <WaitlistQueue
                position={position}
                queueId={queueId}
                onQueueCompleteAction={handleQueueComplete}
                onStageChangeAction={(stage) => {
                  // Handle stage change if needed
                }}
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
                onShareAction={handleShare}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 