import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, RefreshCcw } from 'lucide-react';
import { getApiKey } from '@/app/(dashboard)/_components/chat/utils/api-utils';

interface WaitlistScreenProps {
  onComplete?: (apiKey: string) => void;
  initialCount?: number;
  minWaitTime?: number; // minimum wait time in ms
  apiKeyGenerationTime?: number; // simulated API key generation time in ms
}

const WaitlistScreen: React.FC<WaitlistScreenProps> = ({
  onComplete,
  initialCount = 23, // Start with more people for a more satisfying countdown
  minWaitTime = 1500, // minimum 15 seconds of wait time
  apiKeyGenerationTime = 3000, // 30 seconds by default
}) => {
  const router = useRouter();
  const [peopleAhead, setPeopleAhead] = useState<number>(initialCount);
  const [progress, setProgress] = useState<number>(0);
  const [queueId] = useState<string>(`${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [showContinue, setShowContinue] = useState<boolean>(false);
  const apiKeyGenerationStarted = useRef<boolean>(false);
  const decrementTimers = useRef<NodeJS.Timeout[]>([]);
  
  // Function to generate a real API key using getApiKey
  const generateApiKey = useCallback(async () => {
    if (apiKeyGenerationStarted.current) return;
    apiKeyGenerationStarted.current = true;
    // Simulate delay for API key generation (if needed for UX)
    setTimeout(async () => {
      const newApiKey = await getApiKey();
      setApiKey(newApiKey);
      // Waitlist jumps to 0 as soon as API key is generated
      setPeopleAhead(0);
      setProgress(100);
      setIsComplete(true);
      setShowContinue(true);
    }, apiKeyGenerationTime);
  }, [apiKeyGenerationTime]);

  // Function to handle the countdown logic
  const startCountdown = useCallback(() => {
    // Clear any existing timers
    decrementTimers.current.forEach(timer => clearTimeout(timer));
    decrementTimers.current = [];
    
    // Calculate how many decrements we'll have and at what intervals
    const totalDecrements = initialCount;
    const baseInterval = minWaitTime / totalDecrements;
    
    // Create a dynamic decrement schedule
    // More frequent at the beginning, slower towards the end for anticipation
    for (let i = 0; i < totalDecrements; i++) {
      const dynamicInterval = baseInterval * (1 + (i / totalDecrements) * 0.5);
      const timer = setTimeout(() => {
        setPeopleAhead(prev => {
          const newValue = prev - 1;
          // Update progress based on new value
          setProgress(((initialCount - newValue) / initialCount) * 100);
          
          // Handle completion
          if (newValue === 0) {
            setIsComplete(true);
            // If API key is already generated, show continue button
            if (apiKey) {
              setShowContinue(true);
            }
          }
          
          return Math.max(0, newValue);
        });
      }, baseInterval * i + Math.random() * 500); // Add slight randomness
      
      decrementTimers.current.push(timer);
    }
  }, [initialCount, minWaitTime, apiKey]);
  
  // Start countdown and API key generation on component mount
  useEffect(() => {
    generateApiKey();
    startCountdown();
    
    return () => {
      // Clean up timers on unmount
      decrementTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, [generateApiKey, startCountdown]);
  
  // Show continue button only when both countdown and API key are ready
  useEffect(() => {
    if (isComplete && apiKey) {
      setShowContinue(true);
    }
  }, [isComplete, apiKey]);

  // Auto-push to /chat when showContinue becomes true
  useEffect(() => {
    if (showContinue && apiKey) {
      // Give a brief moment for user to see success, then push
      const timeout = setTimeout(() => {
        if (onComplete) onComplete(apiKey);
        router.push('/chat');
      }, 1200); // 1.2s delay for smoothness
      return () => clearTimeout(timeout);
    }
  }, [showContinue, apiKey, onComplete, router]);

  // Call onComplete only when continue is shown and user clicks continue (if you have a continue button)
  // If you want to auto-complete, you can call onComplete here as before.

  // Variants for animations
  const numberVariants = {
    initial: { scale: 1.5, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 20 
      } 
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg max-w-md w-full mx-2 sm:mx-4 p-4 sm:p-8"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-gray-700 font-medium mb-6 tracking-wide">
            YOU ARE NOW IN THE QUEUE
          </h2>
          
          <div className="relative flex justify-center items-center h-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={peopleAhead}
                variants={numberVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`absolute text-7xl font-bold ${peopleAhead === 0 ? 'text-green-600' : 'text-blue-600'}`}
              >
                {peopleAhead}
              </motion.div>
            </AnimatePresence>
            
            {peopleAhead === 0 && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -mt-1 ml-12"
              >
                <div className="bg-green-100 text-green-600 rounded-full p-1">
                  <Check size={20} />
                </div>
              </motion.div>
            )}
          </div>
          
          <motion.p 
            animate={{ 
              opacity: peopleAhead === 0 ? 0.5 : 1,
              y: peopleAhead === 0 ? 5 : 0
            }}
            className="text-gray-500 text-sm tracking-wide mb-2">
            {peopleAhead === 0 ? 'YOU ARE NEXT!' : 'PEOPLE AHEAD OF YOU'}
          </motion.p>
          
          {!apiKey && peopleAhead === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center text-sm text-blue-600"
            >
              <RefreshCcw size={14} className="animate-spin mr-2" />
              Generating your access credentials...
            </motion.div>
          )}
        </motion.div>

        <div className="mb-6 relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", damping: 20 }}
            />
          </div>
          
          {/* Add decorative pulsing dots along the progress bar */}
          {[25, 50, 75].map(position => (
            <motion.div 
              key={position}
              className={`absolute top-0 h-2 w-2 rounded-full ${progress >= position ? 'bg-blue-600' : 'bg-gray-300'}`}
              style={{ left: `${position}%`, marginLeft: '-4px' }}
              animate={{
                scale: progress >= position ? [1, 1.5, 1] : 1,
              }}
              transition={{
                repeat: progress >= position ? Infinity : 0,
                repeatDelay: 2,
                duration: 1
              }}
            />
          ))}
        </div>

        <div className="mb-8 text-center text-sm text-gray-500">
          <p className="font-mono">QUEUE ID: {queueId}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Check size={16} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-xs font-medium mb-2">Stick To One Device</h3>
            <p className="text-xs text-gray-500">Join the queue from one browser on one device.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Check size={16} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-xs font-medium mb-2">One Tab Only</h3>
            <p className="text-xs text-gray-500">Multiple tabs may cause you to lose your place in line.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertCircle size={16} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-xs font-medium mb-2">Bot Detection is Live</h3>
            <p className="text-xs text-gray-500">Disable any browser extensions that may cause issues.</p>
          </motion.div>
        </div>

        {showContinue && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <button 
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors relative overflow-hidden group"
              onClick={() => onComplete && onComplete(apiKey!)}
            >
              <span className="relative z-10">Continue to App</span>
              <motion.div 
                className="absolute inset-0 bg-blue-500 z-0"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ type: "tween" }}
              />
            </button>
            <p className="text-xs text-center mt-3 text-gray-500">
              API Key successfully generated and ready to use
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default WaitlistScreen;
