'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Twitter, Dice6, Linkedin, MessageCircle, Instagram } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { COLOR_SCHEMES, type ColorScheme } from '@/data/color-schemes';

interface CreatorCardProps {
  name: string;
  title: string;
  joinDate?: string;
  onShare?: () => void;
}

export const CreatorCard = ({
  name,
  title,
  joinDate,
  onShare
}: CreatorCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'instagram' | 'general') => {
    const shareText = `🚀 Just joined the @HeyContent waitlist! Join me in revolutionizing content creation.`;
    
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

  const currentScheme = COLOR_SCHEMES[colorSchemeIndex];

  return (
    <div className="max-w-md mx-auto perspective-1000">
      <div className="relative">
        <button
          aria-label="Change card theme"
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
                    <p className="text-black/90 text-lg font-semibold">{title}</p>
                  </div>

                  {/* Queue ID section */}
                  <div className="mt-auto w-full text-left">
                    <p className="text-sm text-black/80">Joined on {joinDate}</p>
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
}; 