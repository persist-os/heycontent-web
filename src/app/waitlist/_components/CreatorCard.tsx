'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Twitter, Dice6, Linkedin, MessageCircle, Instagram } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { COLOR_SCHEMES, type ColorScheme } from '@/data/color-schemes';

const COLOR_NAMES: Record<string, string> = {
  '#7E3AF2': 'purple',
  '#F43F5E': 'rose',
  '#0EA5E9': 'sky blue',
  '#10B981': 'emerald',
  '#8B5CF6': 'violet',
  '#EC4899': 'pink',
  '#06B6D4': 'cyan',
  '#FB923C': 'orange',
  '#6366F1': 'indigo',
  '#14B8A6': 'teal',
  '#F59E0B': 'amber',
  '#4F46E5': 'indigo',
  '#FF6B00': 'orange',
  '#00C2FF': 'blue',
  '#FF3CAC': 'magenta',
  '#00FFB8': 'mint',
  '#FFD600': 'yellow',
  '#B388FF': 'lavender',
  '#FF0000': 'red',
  '#9147FF': 'purple',
  '#2196F3': 'blue',
  '#8E24AA': 'purple'
};

const CREATIVE_VISIONS: Record<string, string> = {
  '#7E3AF2': 'my royal creative vision',
  '#F43F5E': 'my passionate storytelling',
  '#0EA5E9': 'my limitless imagination',
  '#10B981': 'my innovative spirit',
  '#8B5CF6': 'my magical perspective',
  '#EC4899': 'my vibrant creativity',
  '#06B6D4': 'my crystal-clear vision',
  '#FB923C': 'my warm creative energy',
  '#6366F1': 'my deep creative wisdom',
  '#14B8A6': 'my fresh perspective',
  '#F59E0B': 'my golden creative touch',
  '#4F46E5': 'my bold creative vision',
  '#FF6B00': 'my fiery passion',
  '#00C2FF': 'my sky-high dreams',
  '#FF3CAC': 'my artistic flair',
  '#00FFB8': 'my refreshing ideas',
  '#FFD600': 'my bright creative spark',
  '#B388FF': 'my dreamy vision',
  '#FF0000': 'my powerful creativity',
  '#9147FF': 'my creative magic',
  '#2196F3': 'my ocean of ideas',
  '#8E24AA': 'my creative depth'
};

interface CreatorCardProps {
  name: string;
  onShareAction?: () => void;
}

export const CreatorCard = ({
  name,
  onShareAction
}: CreatorCardProps) => {
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showShareOptions &&
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(event.target as Node)
      ) {
        setShowShareOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTapHint(false);
    }, 3000); // Hide after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'instagram' | 'general') => {
    const creativeVision = CREATIVE_VISIONS[currentScheme.primary] || 'my unique creative vision';
    const shareText = `🚀 I just joined the @HeyContent beta program as a ${currentScheme.title}! Getting early access to cutting-edge creator tools and features. Who's joining me in the beta? #BetaTester #CreatorTools`;
    
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
              title: 'HeyContent Beta Program',
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
    setShowShareOptions(false);
  };

  const handleColorChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setColorSchemeIndex((prev) => (prev + 1) % COLOR_SCHEMES.length);
  };

  const currentScheme = COLOR_SCHEMES[colorSchemeIndex];

  return (
    <div className="max-w-md mx-auto perspective-1000">
      <div className="relative">
        <div className="absolute -right-12 top-4 flex flex-col gap-2">
          <button
            title="Randomize"
          onClick={handleColorChange}
            className="p-2 rounded-full bg-background shadow-lg hover:shadow-xl transition-all duration-300 group border border-border"
          style={{ color: currentScheme.primary }}
        >
          <Dice6 className="w-6 h-6 transform group-hover:rotate-180 transition-transform duration-500" />
        </button>
          <button
            title="Share"
            ref={shareButtonRef}
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="p-2 rounded-full bg-background shadow-lg hover:shadow-xl transition-all duration-300 group border border-border"
            style={{ color: currentScheme.primary }}
          >
            <Share2 className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>

        {showShareOptions && (
          <motion.div
            ref={shareMenuRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -right-48 top-4 bg-background rounded-xl shadow-xl p-3 z-50 border border-border"
          >
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                <span className="text-sm font-medium text-foreground">Share on X</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Linkedin className="w-5 h-5 text-[#0077B5]" />
                <span className="text-sm font-medium text-foreground">Share on LinkedIn</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <span className="text-sm font-medium text-foreground">Share on WhatsApp</span>
              </button>
              <button
                onClick={() => handleShare('instagram')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Instagram className="w-5 h-5 text-[#E4405F]" />
                <span className="text-sm font-medium text-foreground">Share on Instagram</span>
              </button>
              <button
                onClick={() => handleShare('general')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Share2 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Copy Link</span>
              </button>
            </div>
          </motion.div>
        )}

        <Tilt
          tiltMaxAngleX={10}
          tiltMaxAngleY={10}
          perspective={1000}
          scale={1.05}
          transitionSpeed={2000}
          className="will-change-transform card-container"
        >
          <div 
            className="relative w-full aspect-[3/4] min-h-[420px] max-h-[600px] mx-auto cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
          >
            <div 
              className={`absolute inset-0 aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-500 transform-gpu border-2 ${isFlipped ? 'rotate-y-180' : ''}`}
              style={{ borderColor: currentScheme.primary }}
            >
              {/* Front of card */}
              <div className={`absolute inset-0 backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
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
                    <motion.p 
                      initial={{ opacity: 1 }}
                      animate={{ opacity: showTapHint ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-sm text-muted-foreground mt-4"
                    >
                      Tap to flip
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div className={`absolute inset-0 backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <h3 className="text-2xl font-bold mb-6" style={{ color: currentScheme.primary }}>Your Share Message</h3>
                  <div className="mt-4 p-6 rounded-xl bg-background/10 backdrop-blur-sm border border-border relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full text-sm font-medium border border-border" style={{ color: currentScheme.primary }}>
                      Preview
                    </div>
                    <p className="text-lg font-medium" style={{ color: currentScheme.primary }}>
                      {`🚀 I just joined the @HeyContent beta program as a ${currentScheme.title}! Getting early access to cutting-edge creator tools and features. Who's joining me in the beta? #BetaTester #CreatorTools`}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-muted-foreground">
                    <Share2 className="w-5 h-5" />
                    <p>Click the share icon above to post this message</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Try different colors to customize your message!</p>
                </div>
              </div>
            </div>
          </div>
        </Tilt>
      </div>
    </div>
  );
}; 