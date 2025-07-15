'use client'

import React, { useEffect, useState } from 'react'
import { Mail, Users, Lightbulb, CheckCircle, FolderOpen, Inbox, Tag, Sparkles, Coffee, Zap, Heart, Star } from 'lucide-react'

interface PartnershipProgressiveThinkingProps {
  searchStatus?: string
  isCompleted?: boolean
  progressData?: {
    processed_count?: number
    labeled_count?: number
    learned_signals?: number
    stored_count?: number
  }
}

const steps = [
  {
    icon: <Lightbulb className="w-4 h-4" />,
    label: "Learning from your Gmail label changes",
    baseTime: 2000,
    messages: [
      "Studying your organization superpowers like it's my main character moment...",
      "Taking notes on how you sort your digital life (and honestly, we're impressed)",
      "Learning from your label moves because your system is actually iconic",
      "Absorbing your organizational energy... this is giving productivity influencer vibes",
      "Your Gmail game is strong and we're here for it 💯",
      "Decoding your filing system like it's the Da Vinci Code but make it emails",
      "Your organization skills are giving main character energy and we're taking notes",
      "Watching you organize emails like it's performance art (because it kind of is)",
      "Your labeling strategy is lowkey genius and we're studying the blueprint",
      "Getting schooled on email organization by a literal pro",
      "Your Gmail setup is giving 'I have my life together' energy",
      "Learning from the master of inbox zen... teach us your ways",
      "Your organizational system is chef's kiss and we're taking detailed notes",
      "Studying your email choreography because this is an art form",
      "Your Gmail organization is giving sophisticated adult energy",
      "Taking a masterclass in email management from the GOAT",
      "Your system is so clean it's making us reconsider our entire approach",
      "Getting educated on proper email etiquette by watching a pro at work",
      "Your labeling game is immaculate and we're here for the lesson",
      "Learning organizational magic from someone who clearly has it figured out"
    ]
  },
  {
    icon: <Inbox className="w-4 h-4" />,
    label: "Fetching new emails (skipping ones you've already seen)",
    baseTime: 3000,
    messages: [
      "Only peeking at the fresh opportunities because we respect your time ⏰",
      "Skipping the old news and diving straight into the good stuff",
      "No reruns here - just the latest episodes of your inbox drama",
      "Filtering out the seen-it-already content like a selective bestie",
      "Your time is precious so we're only bringing the new-new",
      "Avoiding email déjà vu because ain't nobody got time for that",
      "Curating only the fresh drops from your inbox collection",
      "Speed-running past the old emails to get to the juicy new ones",
      "Being selective about what deserves your attention (as we should)",
      "Only serving up the emails you haven't eyeballed yet",
      "Respectfully ignoring the emails you've already blessed with your presence",
      "Cherry-picking the newest additions to your inbox anthology",
      "Skipping reruns and heading straight to the season finale emails",
      "Your inbox is giving subscription box vibes and we're here for the unboxing",
      "Only bringing you the emails that passed the 'is this new?' vibe check",
      "Treating your inbox like a curated playlist - no repeats, only bangers",
      "Being that friend who only tells you gossip you haven't heard yet",
      "Your inbox is getting the VIP treatment - fresh content only",
      "We're basically your personal email sommelier, selecting only the finest new vintage",
      "Filtering through your emails like we're shopping for the perfect outfit"
    ]
  },
  {
    icon: <Tag className="w-4 h-4" />,
    label: "Categorizing and organizing your inbox",
    baseTime: 2500,
    messages: [
      "Sorting your emails like we're organizing a walk-in closet ✨",
      "Creating email neighborhoods where everyone knows their place",
      "Playing matchmaker between emails and their perfect categories",
      "Giving every email a home because everyone deserves to belong",
      "Organizing your inbox like we're Marie Kondo but for partnerships",
      "Creating order from chaos like we're conducting an email symphony",
      "Putting emails in their proper boxes like we're moving apartments",
      "Sorting through opportunities like we're casting for the perfect collaboration",
      "Creating email harmony because balance is everything",
      "Organizing your partnerships like we're planning a wedding seating chart",
      "Giving your emails the filing system they deserve",
      "Creating categories that make sense (unlike most things in 2024)",
      "Sorting partnerships like we're organizing a music festival lineup",
      "Making sure every email finds its tribe",
      "Organizing opportunities like we're curating a museum exhibit",
      "Creating order in the inbox universe, one email at a time",
      "Sorting your collaborations like we're building the perfect playlist",
      "Giving your emails the organization they've been dreaming of",
      "Creating categories that would make a librarian weep with joy",
      "Organizing partnerships like we're planning the world's most exclusive event",
      "Making your inbox so organized it could win awards",
      "Sorting emails with the precision of a Swiss watchmaker",
      "Creating email harmony that would make feng shui masters proud"
    ]
  },
  {
    icon: <FolderOpen className="w-4 h-4" />,
    label: "Saving new partnership opportunities to your dashboard",
    baseTime: 1800,
    messages: [
      "Securing your next collab like we're your personal opportunity bodyguard 🛡️",
      "Filing away potential partnerships like we're building your empire portfolio",
      "Your dashboard is about to get a major glow-up with these opportunities",
      "Saving partnerships like we're collecting rare Pokemon cards",
      "Adding new collabs to your dashboard like we're updating your vision board",
      "Your opportunity collection is growing and we're here for this expansion era",
      "Tucking partnerships safely into your dashboard like love letters in a box",
      "Your collab portfolio is about to be absolutely stacked",
      "Adding opportunities to your dashboard like we're planting seeds for future success",
      "Your partnership garden is about to bloom and we're the gardeners",
      "Safely storing your collaborations like we're running a partnership bank",
      "Your dashboard is getting the update it deserves with these fresh opportunities",
      "Adding partnerships to your collection like we're building a collaboration museum",
      "Your opportunity vault is getting restocked with premium partnerships",
      "Saving collabs like we're backing up your dreams to the cloud",
      "Your dashboard is about to look absolutely fire with these new additions",
      "Adding opportunities like we're updating your favorite playlist",
      "Your partnership library is expanding and we're the librarians",
      "Storing collaborations like we're preserving moments in amber",
      "Your dashboard is getting a luxury upgrade with these premium opportunities",
      "Adding partnerships like we're decorating your digital vision board",
      "Your opportunity treasure chest is getting restocked",
      "Saving collabs like we're building your personal partnership hall of fame",
      "Your dashboard is about to be the main character of opportunity collections"
    ]
  }
];

// Helper to get a random index, avoiding the previous one
function getRandomIndex(arrayLength: number, prevIndex: number | null): number {
  if (arrayLength <= 1) return 0;
  let idx = Math.floor(Math.random() * arrayLength);
  while (idx === prevIndex) {
    idx = Math.floor(Math.random() * arrayLength);
  }
  return idx;
}

export const PartnershipProgressiveThinking: React.FC<PartnershipProgressiveThinkingProps> = ({ 
  searchStatus = '', 
  isCompleted = false,
  progressData
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [messageIndices, setMessageIndices] = useState(() => 
    steps.map(() => getRandomIndex(steps[0].messages.length, null))
  );
  const [prevMessageIndices, setPrevMessageIndices] = useState(() => 
    steps.map(() => null as number | null)
  );

  // Message cycling effect for current step
  useEffect(() => {
    if (isCompleted || stepIdx >= steps.length) return;
    
    const currentStep = steps[stepIdx];
    const interval = setInterval(() => {
      setMessageIndices(prev => {
        const newIndices = [...prev];
        const newIndex = getRandomIndex(currentStep.messages.length, prev[stepIdx]);
        newIndices[stepIdx] = newIndex;
        return newIndices;
      });
      
      setPrevMessageIndices(prev => {
        const newPrev = [...prev];
        newPrev[stepIdx] = messageIndices[stepIdx];
        return newPrev;
      });
    }, 2000 + Math.random() * 1000); // Random interval between 2-3 seconds
    
    return () => clearInterval(interval);
  }, [stepIdx, isCompleted, messageIndices]);

  // Step progression effect - only moves forward, never backward
  useEffect(() => {
    if (isCompleted || stepIdx >= steps.length - 1) return;
    
    const currentStep = steps[stepIdx];
    const dynamicTime = currentStep.baseTime + Math.random() * 1000; // Add some randomness
    
    const timeout = setTimeout(() => {
      setStepIdx(prev => {
        const nextStep = prev + 1;
        // Never go past the last step
        return nextStep >= steps.length ? steps.length - 1 : nextStep;
      });
    }, dynamicTime);
    
    return () => clearTimeout(timeout);
  }, [stepIdx, isCompleted]);

  // Handle completion - set to final step and stay there
  useEffect(() => {
    if (isCompleted && stepIdx < steps.length - 1) {
      setStepIdx(steps.length - 1);
    }
  }, [isCompleted, stepIdx]);

  // Friendly, human summary on completion
  const getCompletionMessage = () => {
    const learned = progressData?.learned_signals || 0;
    const found = progressData?.labeled_count || 0;
    const saved = progressData?.stored_count || 0;
    const processed = progressData?.processed_count || 0;

    if (processed === 0 && learned === 0) {
      return (
        <>
          <span className="font-medium text-foreground">We're all caught up, bestie! ✨</span> <br />
          <span className="text-muted-foreground">Your inbox is looking pristine right now – no new partnership opportunities to process! But honestly? Your next collab could slide into your DMs any second. Keep being amazing and creating that magnetic energy that draws the best opportunities your way! 🌟</span>
        </>
      );
    }

    const completionMessages = [
      "Periodt! We just delivered the partnership tea and it's piping hot! ☕",
      "And that's how you level up your collaboration game! We're literally obsessed! 💅",
      "Mission accomplished! Your partnership portfolio just got a major glow-up! ✨",
      "Boom! Your collaboration kingdom just expanded and we're here for it! 👑",
      "Consider us your partnership fairy godmother – mission complete! 🧚‍♀️",
      "We just organized your collab world and honestly, we're pretty proud of ourselves! 🎉",
      "Your partnership game is about to be absolutely unmatched! We delivered! 🔥",
      "Plot twist: we just made your collaboration dreams come true! 💫"
    ];

    const randomMessage = completionMessages[Math.floor(Math.random() * completionMessages.length)];

    return (
      <>
        <span className="font-medium text-foreground">{randomMessage}</span> <br />
        <span className="text-muted-foreground">
          {learned > 0 && (
            <span className="block flex items-center gap-1 mt-1">
              <Lightbulb className="inline w-4 h-4 text-yellow-500" /> 
              Absorbed wisdom from <b>{learned}</b> of your Gmail organization moves (we're taking notes!)
            </span>
          )}
          {found > 0 && (
            <span className="block flex items-center gap-1 mt-1">
              <Users className="inline w-4 h-4 text-blue-500" /> 
              Discovered <b>{found}</b> fresh partnership opportunities (your network is iconic!)
            </span>
          )}
          {saved > 0 && (
            <span className="block flex items-center gap-1 mt-1">
              <Heart className="inline w-4 h-4 text-pink-500" /> 
              Secured <b>{saved}</b> collabs in your dashboard (your future self will thank us!)
            </span>
          )}
          {processed > 0 && (
            <span className="block flex items-center gap-1 mt-1">
              <Mail className="inline w-4 h-4 text-green-500" /> 
              Processed <b>{processed}</b> emails with the efficiency of a productivity influencer
            </span>
          )}
          <span className="block mt-3 text-sm">
            {[
              "Your partnership era is about to be legendary! Keep creating, keep connecting, and keep being absolutely unstoppable! 🚀",
              "We're literally manifesting all the best collaborations for you! Your creative journey is about to get so much more exciting! ✨",
              "You're about to enter your collaboration villain era and we're absolutely here for it! Go get 'em, bestie! 💪",
              "Your partnership portfolio is looking absolutely elite! Time to watch those opportunities turn into something magical! 🌟",
              "We just organized your entire collab universe and honestly? Your future partnerships are going to be absolutely incredible! 🎯"
            ][Math.floor(Math.random() * 5)]}
          </span>
        </span>
      </>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {steps.map((step, idx) => {
          const isDone = isCompleted || idx < stepIdx;
          const isActive = !isCompleted && idx === stepIdx;
          const isFuture = idx > stepIdx && !isCompleted;
          
          return (
            <div
              key={step.label}
              className={`flex items-start gap-3 rounded-lg px-4 py-3 transition-all duration-300 border
                ${isDone 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                  : isActive 
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 shadow-lg shadow-purple-100 dark:shadow-purple-900/20' 
                    : 'bg-muted/30 border-muted text-muted-foreground'}
                ${isActive ? 'scale-[1.02] shadow-md' : ''}
              `}
            >
              <div className="mt-1 flex-shrink-0">
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : isActive ? (
                  <div className="relative">
                    {step.icon}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <div className="opacity-50">{step.icon}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm leading-5 ${isActive ? 'text-purple-900 dark:text-purple-100' : ''}`}>
                  {step.label}
                </div>
                <div className={`text-xs mt-1 leading-4 ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-muted-foreground'}`}>
                  {isActive ? (
                    <span className="animate-pulse">
                      {step.messages[messageIndices[idx]]}
                    </span>
                  ) : (
                    step.messages[messageIndices[idx]]
                  )}
                </div>
              </div>
              {isActive && (
                <div className="flex-shrink-0 mt-1">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {isCompleted && (
        <div className="flex items-start gap-3 mt-6 p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex-shrink-0 mt-1">
            <div className="relative">
              <Star className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <Sparkles className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <div className="flex-1 text-sm leading-5">
            {getCompletionMessage()}
          </div>
        </div>
      )}
    </div>
  )
} 