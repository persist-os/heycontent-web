import React from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Twitter, Linkedin, MessageCircle, Instagram, ArrowRight } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { COLOR_SCHEMES } from '@/data/color-schemes';
import { WaitlistCardProps } from '../types';

export const WaitlistCard: React.FC<WaitlistCardProps> = ({
  queueId,
  onCopyInviteLink,
  copied,
  onShare,
  invitesLeft,
  onColorChange,
  colorSchemeIndex,
  isFlipped,
  onCardClick,
}) => {
  const currentScheme = COLOR_SCHEMES[colorSchemeIndex];

  return (
    <div className="max-w-md mx-auto perspective-1000">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-yellow-500 mb-2">🎉 Congratulations!</h2>
        <p className="text-lg text-gray-700 mb-1">You're on the waitlist!</p>
        <p className="text-base text-gray-500">Invite friends to move up in line.</p>
      </div>
      
      <div className="relative">
        <button
          title="Change Card Color"
          onClick={onColorChange}
          className="absolute -right-12 top-4 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 group z-10"
          style={{ color: currentScheme.primary }}
        >
          <div className="w-6 h-6 rounded-full" style={{ background: currentScheme.primary }} />
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
          <div className="relative w-full aspect-[3/4] min-h-[420px] max-h-[600px] mx-auto">
            <motion.div 
              className="absolute inset-0 w-full h-full cursor-pointer preserve-3d transition-all duration-700"
              style={{ 
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                background: `linear-gradient(135deg, ${currentScheme.primary} 0%, ${currentScheme.gradient} 100%)`,
                borderRadius: '1rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
              onClick={onCardClick}
            >
              {/* Front of card */}
              <div className={`absolute inset-0 flex flex-col justify-between p-6 backface-hidden`}>
                <div>
                  <h3 className="text-white text-2xl font-bold mb-2">Your Invite Code</h3>
                  <div className="bg-white/20 rounded-lg p-4 mb-6">
                    <p className="text-white font-mono text-xl tracking-wider">{queueId}</p>
                  </div>
                  <p className="text-white/80 mb-4">Share your code to move up in line!</p>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyInviteLink();
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-white text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
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
                  
                  <div className="flex justify-center space-x-4">
                    {['twitter', 'whatsapp', 'linkedin', 'instagram'].map((platform) => (
                      <button
                        key={platform}
                        onClick={(e) => {
                          e.stopPropagation();
                          onShare(platform as any);
                        }}
                        className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        title={`Share on ${platform}`}
                      >
                        {platform === 'twitter' && <Twitter className="w-5 h-5" />}
                        {platform === 'whatsapp' && <MessageCircle className="w-5 h-5" />}
                        {platform === 'linkedin' && <Linkedin className="w-5 h-5" />}
                        {platform === 'instagram' && <Instagram className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Back of card */}
              <div className={`absolute inset-0 flex flex-col justify-center items-center p-6 backface-hidden`} style={{ transform: 'rotateY(180deg)' }}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6 mx-auto">
                    <span className="text-4xl">✨</span>
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-2">Invite Friends</h3>
                  <p className="text-white/80 mb-6">You have <span className="font-bold">{invitesLeft} invites</span> left</p>
                  <p className="text-white/60 text-sm mb-6">For each friend who joins, you'll move up in line!</p>
                  <div className="flex justify-center">
                    <button 
                      className="flex items-center space-x-2 bg-white/20 text-white px-6 py-2 rounded-full hover:bg-white/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick();
                      }}
                    >
                      <span>Back</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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

export default WaitlistCard;
