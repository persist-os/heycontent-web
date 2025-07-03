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
    <div
      className="min-h-screen bg-gradient-to-b from-[#F8F0F9] to-blue-50 light-mode-forced"
      style={{
        '--background': '0 0% 100%',
        '--foreground': '240 10% 3.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '240 10% 3.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '240 10% 3.9%',
        '--primary': '55 95% 58%',
        '--primary-foreground': '0 0% 0%',
        '--secondary': '240 4.8% 95.9%',
        '--secondary-foreground': '240 5.9% 10%',
        '--muted': '240 4.8% 95.9%',
        '--muted-foreground': '240 3.8% 46.1%',
        '--accent': '55 95% 58%',
        '--accent-foreground': '0 0% 0%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '0 0% 98%',
        '--border': '240 5.9% 90%',
        '--input': '0 0% 100%',
        '--ring': '55 95% 58%',
      } as React.CSSProperties}
    >
      <style>{`
        .light-mode-forced input,
        .light-mode-forced input[type="text"],
        .light-mode-forced input[type="email"],
        .light-mode-forced input[type="password"],
        .light-mode-forced textarea {
          background: #fff !important;
          color: #222 !important;
        }
      `}</style>
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