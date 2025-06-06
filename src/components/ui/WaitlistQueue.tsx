'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './logo';
import { Share2, Copy, Check, Twitter, Dice6, Linkedin, MessageCircle, Instagram, ArrowRight } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { COLOR_SCHEMES, type ColorScheme } from '@/data/color-schemes';

interface WaitlistQueueProps {
  position: number;
  queueId: string;
  onQueueComplete?: () => void;
  onStageChange?: (stage: 'register' | 'queue' | 'card') => void;
}

export const WaitlistQueue = ({ position, queueId, onQueueComplete, onStageChange }: WaitlistQueueProps) => {
  const [stage, setStage] = useState<'register' | 'queue' | 'card'>('register');
  const [currentPosition, setCurrentPosition] = useState(position);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [invitesLeft, setInvitesLeft] = useState(3);
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);
  
  useEffect(() => {
    if (stage === 'queue') {
    const interval = setInterval(() => {
        setCurrentPosition(prev => (prev > 0 ? prev - 1 : prev));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'queue' && currentPosition <= 0) {
      setStage('card');
        onQueueComplete?.();
    }
  }, [currentPosition, onQueueComplete, stage]);

  useEffect(() => {
    onStageChange?.(stage);
  }, [stage, onStageChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      setStage('queue');
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(`Join me on HeyContent! Use my invite code: ${queueId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'instagram' | 'general') => {
    const shareText = `🚀 Just joined the @HeyContent waitlist! Join me in revolutionizing content creation. Use my invite code: ${queueId}`;
    
    switch (platform) {
      case 'twitter':
        const twitterText = encodeURIComponent(shareText);
        window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank');
        break;
      case 'linkedin':
        const linkedinText = encodeURIComponent(shareText);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${linkedinText}`, '_blank');
        break;
      case 'whatsapp':
        const whatsappText = encodeURIComponent(shareText);
        window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
        break;
      case 'instagram':
        try {
          await navigator.clipboard.writeText(shareText);
          setCopied(true);
          alert('Text copied! Open Instagram and paste this in your story or DM.');
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
        break;
      case 'general':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'HeyContent Waitlist',
              text: shareText,
              url: window.location.href
            });
          } catch (err) {
            console.error('Error sharing:', err);
          }
        } else {
          try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error('Failed to copy text: ', err);
          }
        }
        break;
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
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-yellow-500 mb-2">🎉 Congratulations!</h2>
          <p className="text-lg text-gray-700 mb-1">You made it to the front of the waitlist! Welcome to HeyContent.</p>
          <p className="text-base text-gray-500">We will email you shortly with your code.</p>
        </div>
        <div className="relative">
          <button
            onClick={handleColorChange}
            className="absolute -right-12 top-4 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            style={{ color: currentScheme.primary }}
          >
            <Dice6 className="w-6 h-6 transform group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <Tilt
            tiltMaxAngleX={10}
            tiltMaxAngleY={10}
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
            {/* Fixed aspect ratio and height container for flipping faces */}
            <div className="relative w-full aspect-[3/4] min-h-[420px] max-h-[600px] mx-auto">
              <motion.div 
                className="absolute inset-0 w-full h-full cursor-pointer preserve-3d transition-all duration-700"
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front of card */}
                <div className={`${isFlipped ? 'backface-hidden' : ''} 
                  absolute inset-0 aspect-[3/4] rounded-2xl overflow-hidden
                  shadow-[0_8px_16px_rgba(0,0,0,0.1)]
                  transition-all duration-300`}
                >
                  {/* Logo section at the top */}
                  <div className="relative w-[85%] aspect-square mb-8 mt-4 flex items-center justify-center mx-auto z-20">
                    {/* Dramatic animated gradient aura using current color scheme */}
                    <div
                      className="absolute inset-0 rounded-full blur-2xl animate-gradient"
                      style={{
                        background: `linear-gradient(90deg, ${currentScheme.primary}, ${currentScheme.gradient.via}, ${currentScheme.gradient.to})`,
                        opacity: 0.95,
                        filter: 'brightness(1.2) saturate(1.5)'
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full blur-3xl animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${currentScheme.gradient.via}, transparent)`,
                        opacity: 0.7,
                        filter: 'brightness(1.1) saturate(1.3)'
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full blur-2xl animate-float"
                      style={{
                        background: `linear-gradient(45deg, ${currentScheme.gradient.to}, ${currentScheme.primary}, transparent)`,
                        opacity: 0.7,
                        filter: 'brightness(1.1) saturate(1.3)'
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full blur-xl animate-pulse"
                      style={{
                        background: `linear-gradient(90deg, ${currentScheme.primary}, ${currentScheme.gradient.via}, ${currentScheme.gradient.to})`,
                        opacity: 0.7,
                        filter: 'brightness(1.1) saturate(1.3)'
                      }}
                    ></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src="/images/hey-content-logo.svg"
                        alt="HeyContent Logo"
                        className="w-[85%] h-[85%] object-contain"
                        style={{ filter: 'drop-shadow(0 0 32px ' + currentScheme.gradient.glow + ')' }}
                      />
                    </div>
                  </div>
                  {/* Noise overlay, does NOT cover the logo */}
                  <div
                    className="card-noise-overlay absolute left-0 right-0 bottom-0 top-[30%] rounded-2xl pointer-events-none z-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='black' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"), radial-gradient(circle at 60% 40%, ${currentScheme.gradient.from} 0%, ${currentScheme.gradient.via} 50%, ${currentScheme.gradient.to} 100%)`,
                      backgroundBlendMode: 'multiply',
                      opacity: 0.7
                    }}
                  />
                  <div className="relative h-full flex flex-col items-center p-8 pt-0 z-20">
                    {/* Name and title section */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-black mb-2">{name}</h3>
                      <p className="text-black/90 text-lg font-semibold">{currentScheme.title}</p>
                    </div>

                    {/* Queue ID section */}
                    <div className="mt-auto w-full">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm text-black/80 mb-1">Your Queue ID</p>
                        <p className="text-xl font-mono font-bold text-black">{queueId}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of card */}
                <div className={`${!isFlipped ? 'backface-hidden' : ''} 
                  absolute inset-0 aspect-[3/4] rounded-2xl overflow-hidden transform rotateY-180
                  shadow-[0_8px_16px_rgba(0,0,0,0.1)]
                  transition-all duration-300`}
                >
                  <div
                    className="absolute inset-0 rounded-2xl transition-all duration-300"
                    style={{
                      background: `radial-gradient(circle at 60% 40%, ${currentScheme.gradient.from.replace(/\/50$/, '')} 0%, ${currentScheme.gradient.via.replace(/\/50$/, '')} 50%, ${currentScheme.gradient.to.replace(/\/50$/, '')} 100%)`
                    }}
                  />
                  <div className="card-noise-overlay absolute inset-0 rounded-2xl pointer-events-none z-10" />
                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-black mb-4">Share Your Card</h3>
                      <p className="text-black/90 text-lg font-semibold mb-6">Invite your friends and help them skip the line</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare('twitter');
                          }}
                          className="w-full bg-black/10 backdrop-blur-sm text-black p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-black/20"
                        >
                          <Twitter className="w-5 h-5" />
                          <span>Twitter</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare('linkedin');
                          }}
                          className="w-full bg-black/10 backdrop-blur-sm text-black p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-black/20"
                        >
                          <Linkedin className="w-5 h-5" />
                          <span>LinkedIn</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare('whatsapp');
                          }}
                          className="w-full bg-black/10 backdrop-blur-sm text-black p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-black/20"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare('instagram');
                          }}
                          className="w-full bg-black/10 backdrop-blur-sm text-black p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-black/20"
                        >
                          <Instagram className="w-5 h-5" />
                          <span>Instagram</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare('general');
                          }}
                          className="w-full bg-black/10 backdrop-blur-sm text-black p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-black/20 col-span-2"
                        >
                          <Share2 className="w-5 h-5" />
                          <span>Share to Other Apps</span>
                        </button>
                      </div>

                      <p className="text-center text-sm text-black/75 mt-4">
                        Tap card to flip back
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
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