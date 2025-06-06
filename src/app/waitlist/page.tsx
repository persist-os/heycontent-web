'use client';

import React, { useState } from 'react';
import { WaitlistQueue } from '@/components/ui/WaitlistQueue';
import { CreatorCard } from '@/components/ui/CreatorCard';
import { motion, AnimatePresence } from 'framer-motion';

const generateQueueId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
  const [stage, setStage] = useState<'register' | 'queue' | 'card'>('queue');
  const [queueId] = useState(generateQueueId());
  const [inviteCode] = useState(generateInviteCode());
  const [name, setName] = useState('');
  const [invitesLeft, setInvitesLeft] = useState(3);

  const handleQueueComplete = () => {
    setStage('card');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`Join me on HeyContent! Use my invite code: ${inviteCode}`);
      alert('Invite link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {stage === 'register' && (
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold mb-4"
            >
              Join the Waitlist
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 text-lg"
            >
              Be among the first to experience the future of content creation
            </motion.p>
          </div>
        )}
        {stage === 'queue' && (
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold mb-4"
            >
              You're in line!
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 text-lg"
            >
              Hang tight, we're moving you up the waitlist...
            </motion.p>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WaitlistQueue 
            position={10} 
            queueId={Math.random().toString(36).substring(2, 15)} 
            onQueueComplete={() => {}}
            onStageChange={setStage}
          />
        </motion.div>
      </div>
    </div>
  );
} 