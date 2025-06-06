'use client';

import { motion } from 'framer-motion';
import { RecentSignupProps } from '../types';

export const RecentSignup = ({ name, timeAgo, index }: RecentSignupProps) => {
  // Different animations for different positions
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    }),
    hover: {
      scale: 1.05,
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 0.8 },
    },
  };

  // Different emojis for different positions
  const emojis = ['🎉', '✨', '👋', '🚀', '🎈'];
  const emoji = emojis[index % emojis.length];

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={variants}
      className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md mb-2 flex items-center"
      style={{
        borderLeft: `4px solid #fbbf24`,
      }}
    >
      <span className="text-2xl mr-2">{emoji}</span>
      <div>
        <p className="font-medium text-gray-800">{name} joined the waitlist</p>
        <p className="text-xs text-gray-500">{timeAgo}</p>
      </div>
    </motion.div>
  );
};

export default RecentSignup;
