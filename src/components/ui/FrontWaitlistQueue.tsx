'use client';

<<<<<<< Updated upstream
import React, { useEffect, useState, useRef } from 'react';
=======
console.log('[FrontWaitlistQueue] Module loaded');
import React, { useEffect, useState } from 'react';
>>>>>>> Stashed changes
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './logo';
import { Share2, Copy, Check, Twitter, Dice6 } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { COLOR_SCHEMES } from '@/data/colorSchemes';

interface FrontWaitlistQueueProps {
  position: number;
  queueId: string;
  onQueueComplete?: () => void;
}

export const FrontWaitlistQueue = ({ position, queueId, onQueueComplete }: FrontWaitlistQueueProps) => {
  console.log('[FrontWaitlistQueue] Function start');
  const [stage, setStage] = useState<'register' | 'queue' | 'card'>('register');
  const [currentPosition, setCurrentPosition] = useState(Math.floor(Math.random() * (57 - 51 + 1)) + 51);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [invitesLeft, setInvitesLeft] = useState(3);
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const decrementTimers = useRef<NodeJS.Timeout[]>([]);
  const initialCount = useRef(currentPosition);

  // Function to calculate if we should hang on this number
  const shouldHang = (number: number) => {
    // Hang on prime numbers between 51-57 (53)
    if (number === 53) return true;
    // Hang on numbers divisible by 3
    if (number % 3 === 0) return true;
    // Random chance to hang (20%)
    return Math.random() < 0.2;
  };

  // Helper to generate milestone numbers for the countdown
  function generateMilestones(start: number, steps: number) {
    const milestones = [start];
    let current = start;
    for (let i = 1; i < steps - 1; i++) {
      // Decrement by a random value, but ensure we reach 1 at the end
      const remaining = steps - i;
      const minNext = Math.max(1, current - Math.ceil((current - 1) / remaining) - 1);
      const maxNext = Math.max(1, current - 1 - (remaining - 1));
      const next = Math.max(1, Math.floor(Math.random() * (current - minNext + 1)) + minNext);
      current = Math.max(1, Math.min(next, maxNext));
      milestones.push(current);
    }
    milestones[milestones.length - 1] = 1; // Ensure last is 1
    return milestones;
  }

  // Helper to generate intervals that sum to a total duration, with some longer 'hangs'
  function generateIntervals(count: number, totalDuration: number) {
    const base = Math.floor(totalDuration / count);
    const intervals = Array(count).fill(base);
    const hangIndices = [];
    for (let i = 0; i < count; i++) {
      if (Math.random() < 0.18 || i === Math.floor(count / 2)) hangIndices.push(i);
    }
    let extra = Math.floor(totalDuration * 0.25); // up to 25% of time is for hangs
    for (const idx of hangIndices) {
      const add = Math.floor(Math.random() * (extra / hangIndices.length));
      intervals[idx] += add;
      extra -= add;
    }
    let i = 0;
    while (extra > 0) {
      intervals[i % count]++;
      extra--;
      i++;
    }
    for (let i = 0; i < count; i++) {
      if (!hangIndices.includes(i)) {
        const jitter = Math.floor(Math.random() * 40) - 20;
        intervals[i] = Math.max(30, intervals[i] + jitter);
      }
    }
    return intervals;
  }

  // Function to handle the countdown logic
  const startCountdown = () => {
    decrementTimers.current.forEach(timer => clearTimeout(timer));
    decrementTimers.current = [];
    const start = Math.floor(Math.random() * (57 - 51 + 1)) + 51;
    const steps = Math.floor(Math.random() * 2) + 7; // 7 or 8 steps
    const milestones = generateMilestones(start, steps);
    initialCount.current = start;
    setCurrentPosition(milestones[0]);
    setProgress(0); // Ensure bar starts empty
    const totalDuration = Math.floor(Math.random() * 1000) + 7000; // 7000-8000ms
    const intervals = generateIntervals(milestones.length - 1, totalDuration);
    let acc = 0;
    for (let i = 1; i < milestones.length; i++) {
      acc += intervals[i - 1];
      const value = milestones[i];
      const progressValue = (i / (milestones.length - 1)) * 100;
      const timer = setTimeout(() => {
        setCurrentPosition(value);
        setProgress(progressValue);
        if (value === 1) {
          setStage('card');
          onQueueComplete?.();
        }
      }, acc);
      decrementTimers.current.push(timer);
    }
  };

  useEffect(() => {
    if (stage === 'queue') {
      startCountdown();
    }
    return () => {
      decrementTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, [stage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      setStage('queue');
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText('Join me on HeyContent! https://www.heycontent.co/');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async (platform: 'twitter' | 'copy') => {
    if (platform === 'twitter') {
      const text = encodeURIComponent('🚀 Just joined the @HeyContent waitlist! Join me in revolutionizing content creation: https://www.heycontent.co/');
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    } else {
      handleCopyInviteLink();
    }
  };

  const handleColorChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setColorSchemeIndex((prev) => (prev + 1) % COLOR_SCHEMES.length);
  };

  if (stage === 'register') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4">Join the Waitlist</h1>
          <p className="text-gray-600">Enter your details to secure your spot</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Waitlist
          </button>
        </form>
      </div>
    );
  }

  if (stage === 'card') {
    const currentScheme = COLOR_SCHEMES[colorSchemeIndex];
    
    return (
      <div className="max-w-md mx-auto perspective-1000">
        <div className="relative">
          <button
            onClick={handleColorChange}
            className="absolute -right-12 top-4 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            style={{ color: currentScheme.primary }}
            aria-label="Change card color scheme"
          >
            <Dice6 className="w-6 h-6 transform group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <Tilt
            tiltMaxAngleX={15}
            tiltMaxAngleY={15}
            perspective={1000}
            scale={1.05}
            transitionSpeed={2000}
            glareEnable={true}
            glareMaxOpacity={0.15}
            glareColor="#ffffff"
            glarePosition="all"
            glareBorderRadius="12px"
            className="will-change-transform card-container"
          >
            <motion.div 
              className="relative w-full cursor-pointer preserve-3d transition-all duration-700"
              style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front of card */}
              <div className={`${isFlipped ? 'backface-hidden' : ''} 
                aspect-[3/4] bg-[#FFFDF7] 
                rounded-2xl p-6 overflow-hidden
                shadow-[0_8px_16px_rgba(0,0,0,0.1)]
                transition-all duration-300`}
              >
                <div className="relative h-full flex flex-col items-center" style={{ color: currentScheme.primary }}>
                  {/* Logo section at the top */}
                  <div className="relative w-[85%] aspect-square mb-8 mt-4 flex items-center justify-center">
                    {/* Enhanced background effects */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-${currentScheme.gradient.from} via-${currentScheme.gradient.via} to-${currentScheme.gradient.to} rounded-full blur-2xl animate-gradient`}></div>
                    <div className={`absolute inset-0 bg-gradient-to-br from-${currentScheme.gradient.from} to-transparent rounded-full blur-3xl animate-pulse`}></div>
                    <div className={`absolute inset-0 bg-gradient-to-tl from-${currentScheme.gradient.via} via-${currentScheme.gradient.from} to-transparent rounded-full blur-2xl animate-float-subtle`}></div>
                    {/* Glow ring */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-${currentScheme.gradient.from} via-${currentScheme.gradient.via} to-${currentScheme.gradient.to} blur-xl animate-pulse`}></div>
                    {/* Logo with enhanced glow */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src="/images/hey-content-logo.svg"
                        alt="HeyContent Logo"
                        className="w-[85%] h-[85%] object-contain"
                        style={{ filter: `drop-shadow(0 0 25px ${currentScheme.gradient.glow})` }}
                      />
                    </div>
                  </div>

                  {/* Name and title section */}
                  <div className="text-center mb-auto">
                    <h2 className="text-4xl font-bold mb-1 tracking-wider uppercase">{name}</h2>
                    <p className="text-xl tracking-wider uppercase">{currentScheme.title}</p>
                  </div>

                  {/* Bottom section */}
                  <div className="w-full flex items-end justify-between">
                    <div className="inline-flex items-center">
                      <div className="border rounded-md px-2 py-0.5 flex items-center" style={{ borderColor: currentScheme.primary }}>
                        <span className="uppercase text-xs tracking-wider font-medium">HeyContent</span>
                        <div className="mx-1.5 w-1 h-4" style={{ 
                          backgroundColor: currentScheme.primary,
                          transform: 'skew(-12deg)',
                          opacity: 0.8
                        }}></div>
                        <span className="text-xs tracking-wider uppercase font-medium">{new Date().toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>
                    <div className="text-xs tracking-wider uppercase font-medium" style={{ 
                      color: currentScheme.primary
                    }}>
                      DivertissementAI
                    </div>
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div className={`${!isFlipped ? 'backface-hidden' : ''} 
                absolute inset-0 aspect-[3/4] bg-[#FFFDF7]
                rounded-2xl p-6 overflow-hidden transform rotateY-180
                shadow-[0_8px_16px_rgba(0,0,0,0.1)]
                transition-all duration-300`}
              >
                <div className="relative h-full flex flex-col justify-between" style={{ color: currentScheme.primary }}>
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold mb-4">Share Your Card</h3>
                    <p className="text-sm opacity-90 mb-6">Support us by sharing your card with your friends!</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('twitter');
                      }}
                      className="w-full text-white p-4 rounded-xl 
                        flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      <Twitter className="w-5 h-5" />
                      <span>Share on Twitter</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('copy');
                      }}
                      className="w-full border-2 p-4 rounded-xl 
                        flex items-center justify-center gap-2 transition-all duration-300
                        hover:text-white"
                      style={{ 
                        borderColor: currentScheme.primary,
                        color: currentScheme.primary
                      }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span>Copy Invite Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-sm opacity-75 mt-4">
                    Tap card to flip back
                  </p>
                </div>
              </div>
            </motion.div>
          </Tilt>
        </div>
      </div>
    );
  }

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