import React from 'react';

const LOADING_MESSAGES = [
  "This is about to be so brat",
  "Your content is crashing out in the best way",
  "Chat is this real",
  "Making this absolutely skibidi",
  "Your words are entering their villain era",
  "This content said let me cook",
  "Very demure very mindful very refined",
  "Making this chronically online but make it art",
  "This is giving main character energy",
  "Your content is about to slay and I mean SLAY",
  "Making this bussin no cap",
  "This is about to hit different fr fr",
  "Your words are having their moment",
  "Making this absolutely unhinged in the best way",
  "This content is about to go feral",
  "Your text is getting the glow up it deserves",
  "Making this highkey iconic",
  "This is about to be so valid",
  "Your content is touching grass digitally",
  "Making this absolutely send me",
  "This is giving poetry but make it Gen Z",
  "Your words are about to pop off",
  "Making this the Roman Empire of content",
  "This is about to be so fire the algorithm will notice",
  "Your content is having its hot girl summer",
  "Making this delulu but in a cute way",
  "This is about to be periodt with the T",
  "Your text is entering its reputation era",
  "Making this absolutely rent free worthy",
  "This content is about to be the moment",
  "Your words are giving what they're supposed to give",
  "Making this understood the assignment",
  "This is about to be no thoughts head empty but profound",
  "Your content is manifesting its best life",
  "Making this absolutely ate and left no crumbs",
  "This is giving Shakespeare if he had TikTok",
  "Your text is about to be the CEO of being iconic",
  "Making this lowkey a cultural reset",
  "This content is about to live in my head rent free",
  "Your words are having their Taylor Swift moment",
  "Making this absolutely superior",
  "This is about to be so good it's giving me brain rot",
  "Your content is touching the void poetically",
  "Making this the definition of slay",
  "This text is about to break the internet respectfully",
  "Your words are giving therapy but make it art",
  "Making this absolutely goated",
  "This is about to be canon in the content universe",
  "Your content is having its Barbie movie era",
  "Making this lowkey a religious experience",
  "This text is about to be the blueprint",
  "Your words are serving looks and taking names",
  "Making this absolutely based",
  "This content is about to be permanently in my rotation",
  "Your text is giving what needs to be given",
  "Making this the main event",
  "This is about to be so clean it's illegal",
  "Your content is having its magnum opus moment",
  "Making this absolutely iconic behavior",
  "This text is about to be criminally underrated",
  "Your words are giving instant classic vibes",
  "Making this the gold standard",
  "This content is about to age like fine wine",
  "Your text is serving academic excellence",
  "Making this absolutely immaculate vibes",
  "This is about to be museum worthy",
  "Your content is having its Renaissance moment",
  "Making this lowkey revolutionary",
  "This text is about to be the cultural moment",
  "Your words are giving Hall of Fame energy",
  "Making this absolutely legendary status",
  "This content is about to be eternally relevant",
  "Your text is serving timeless elegance",
  "Making this the definition of perfection",
  "This is about to transcend the mortal plane",
  "Your content is achieving its final form",
  "Making this absolutely divine intervention",
  "This text is ascending to higher consciousness",
  "Your words are achieving nirvana",
  "Making this absolutely enlightened",
  "This content is reaching its ultimate potential",
  "Your text is becoming one with the universe",
  "Making this transcendentally beautiful",
  "This is about to achieve cosmic significance",
  "Your content is unlocking the secrets of existence",
  "Making this absolutely metaphysically profound",
  "This text is channeling the wisdom of ages",
  "Your words are touching the infinite",
  "Making this spiritually transformative",
  "This content is achieving literary enlightenment",
  "Your text is becoming pure artistic expression",
  "Making this absolutely transcendent",
  "This is about to reach peak human achievement",
  "Your content is evolving beyond language",
  "Making this the ultimate form of communication",
  "This text is becoming art in its purest form",
  "Your words are achieving perfect harmony",
  "Almost ready to absolutely demolish",
  "Just putting the final boss touches on this",
  "One more second until this content ascends",
  "Getting ready to serve this on a silver platter",
  "Final preparations for absolute domination"
];

let lastMessageIndex = -1;

/**
 * Gets a random loading message that's different from the previous one
 */
export function getLoadingMessage(): string {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
  } while (newIndex === lastMessageIndex && LOADING_MESSAGES.length > 1);
  
  lastMessageIndex = newIndex;
  return LOADING_MESSAGES[newIndex];
}

/**
 * React hook that provides a loading message that changes every few seconds
 */
export function useRotatingLoadingMessage(intervalMs: number = 2000): string {
  const [message, setMessage] = React.useState(() => getLoadingMessage());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessage(getLoadingMessage());
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs]);
  
  return message;
}

// For non-React contexts
export function createLoadingMessageRotator(intervalMs: number = 2000) {
  let currentMessage = getLoadingMessage();
  let interval: NodeJS.Timeout | null = null;
  
  const start = (callback: (message: string) => void) => {
    callback(currentMessage);
    interval = setInterval(() => {
      currentMessage = getLoadingMessage();
      callback(currentMessage);
    }, intervalMs);
  };
  
  const stop = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };
  
  const getCurrentMessage = () => currentMessage;
  
  return { start, stop, getCurrentMessage };
}