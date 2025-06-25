import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Sparkles } from 'lucide-react'

interface ProgressInsightsStateProps {
  title: string
  quote: string
  subtitle?: string
  progress?: number // 0-100
  platform?: string
}

export function ProgressInsightsState({ 
  title, 
  quote, 
  subtitle, 
  progress = 0,
  platform 
}: ProgressInsightsStateProps) {
  // Clamp progress between 0 and 100, handle undefined/null
  const normalizedProgress = Math.max(0, Math.min(100, progress || 0))
  
  // Show indeterminate state if progress is 0 or very low
  const isIndeterminate = normalizedProgress < 5
  
  // Dynamic color based on platform
  const getPlatformColors = () => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return {
          primary: 'from-red-500 to-red-600',
          secondary: 'from-red-50 to-red-100',
          accent: 'text-red-600',
          glassAccent: 'bg-red-500/10',
          progressBg: 'bg-red-100',
          progressFill: 'bg-gradient-to-r from-red-500 to-red-600'
        }
      case 'instagram':
        return {
          primary: 'from-purple-500 to-pink-500',
          secondary: 'from-purple-50 to-pink-50',
          accent: 'text-purple-600',
          glassAccent: 'bg-purple-500/10',
          progressBg: 'bg-purple-100',
          progressFill: 'bg-gradient-to-r from-purple-500 to-pink-500'
        }
      case 'gmail':
        return {
          primary: 'from-blue-500 to-blue-600',
          secondary: 'from-blue-50 to-blue-100',
          accent: 'text-blue-600',
          glassAccent: 'bg-blue-500/10',
          progressBg: 'bg-blue-100',
          progressFill: 'bg-gradient-to-r from-blue-500 to-blue-600'
        }
      default:
        return {
          primary: 'from-purple-500 to-purple-600',
          secondary: 'from-purple-50 to-purple-100',
          accent: 'text-purple-600',
          glassAccent: 'bg-purple-500/10',
          progressBg: 'bg-purple-100',
          progressFill: 'bg-gradient-to-r from-purple-500 to-purple-600'
        }
    }
  }

  const colors = getPlatformColors()

  return (
    <div className="text-center py-8 px-6">
      {/* Liquid Glass Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative max-w-md mx-auto p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br ${colors.secondary} dark:from-gray-800/60 dark:to-gray-900/60 border border-white/20 dark:border-gray-700/30 shadow-xl`}
      >
        {/* Floating Glass Icon */}
        <div className={`relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.primary} flex items-center justify-center shadow-lg`}>
          <div className="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm" />
          <Brain className="w-8 h-8 text-white relative z-10" />
          
          {/* Sparkles Animation */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </motion.div>
        </div>

        {/* Title */}
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-semibold text-gray-800 dark:text-white mb-3"
        >
          {title}
        </motion.h3>

        {/* Progress Bar with Liquid Glass Effect */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {isIndeterminate ? 'Starting...' : 'Analyzing...'}
            </span>
            <span className={`text-sm font-bold ${colors.accent} dark:text-white`}>
              {isIndeterminate ? '⚡' : `${normalizedProgress}%`}
            </span>
          </div>
          
          {/* Progress Track */}
          <div className={`relative w-full h-3 ${colors.progressBg} dark:bg-gray-700 rounded-full overflow-hidden backdrop-blur-sm`}>
            {/* Progress Fill with Glass Effect */}
            <motion.div
              className={`absolute left-0 top-0 h-full rounded-full ${colors.progressFill} shadow-lg`}
              initial={{ width: 0 }}
              animate={isIndeterminate ? {
                width: ['20%', '80%', '20%'],
                x: ['-20%', '20%', '-20%']
              } : {
                width: `${normalizedProgress}%`
              }}
              transition={isIndeterminate ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : { 
                type: "spring", 
                damping: 20, 
                stiffness: 100,
                duration: 0.8 
              }}
            >
              {/* Glass Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
              
              {/* Animated Shine Sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 1,
                  ease: "easeInOut" 
                }}
                style={{ transform: 'translateX(-100%)' }}
              />
            </motion.div>

            {/* Pulsing Progress Dots */}
            {[25, 50, 75].map(position => (
              <motion.div 
                key={position}
                className={`absolute top-1/2 w-2 h-2 rounded-full transform -translate-y-1/2 ${
                  normalizedProgress >= position 
                    ? `${colors.progressFill} shadow-md` 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ left: `${position}%`, marginLeft: '-4px' }}
                animate={{
                  scale: normalizedProgress >= position ? [1, 1.3, 1] : 1,
                  boxShadow: normalizedProgress >= position 
                    ? [
                        '0 0 0 0 rgba(168, 85, 247, 0.4)',
                        '0 0 0 10px rgba(168, 85, 247, 0)',
                        '0 0 0 0 rgba(168, 85, 247, 0)'
                      ] 
                    : '0 0 0 0 rgba(168, 85, 247, 0)',
                }}
                transition={{
                  scale: {
                    repeat: normalizedProgress >= position ? Infinity : 0,
                    repeatDelay: 0.5,
                    duration: 1,
                    ease: "easeInOut"
                  },
                  boxShadow: {
                    repeat: normalizedProgress >= position ? Infinity : 0,
                    repeatDelay: 0.5,
                    duration: 1.5,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Quote with Typing Effect */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3 font-medium italic"
        >
          "{quote}"
        </motion.p>

        {/* Subtitle */}
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Background Glass Decoration */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full ${colors.glassAccent} backdrop-blur-sm opacity-50`} />
        <div className={`absolute bottom-3 right-3 w-4 h-4 rounded-full ${colors.glassAccent} backdrop-blur-sm opacity-30`} />
      </motion.div>
    </div>
  )
} 