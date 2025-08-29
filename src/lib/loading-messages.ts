import React from 'react';

const LOADING_MESSAGES = [
  "Organizing your thoughts",
  "Finding connections between ideas",
  "Helping you think this through",
  "Processing your insights",
  "Understanding what you're working on",
  "Connecting the dots",
  "Reflecting on your ideas",
  "Building on your thoughts",
  "Exploring different angles",
  "Gathering relevant information",
  "Considering your perspective",
  "Working through the details",
  "Developing your concept",
  "Analyzing the patterns",
  "Expanding on your ideas",
  "Clarifying your thoughts",
  "Structuring your insights",
  "Deepening your understanding",
  "Exploring possibilities",
  "Making sense of complexity",
  "Connecting to your knowledge",
  "Building understanding",
  "Thinking alongside you",
  "Processing information",
  "Developing insights",
  "Exploring connections",
  "Understanding context",
  "Analyzing relationships",
  "Finding patterns",
  "Synthesizing ideas",
  "Creating clarity",
  "Building comprehension",
  "Developing perspective",
  "Exploring implications",
  "Understanding nuances",
  "Processing complexity",
  "Finding meaning",
  "Creating structure",
  "Developing thoughts",
  "Understanding depth",
  "Exploring potential",
  "Building insight",
  "Creating understanding",
  "Developing clarity",
  "Processing your query",
  "Understanding your needs",
  "Analyzing the information",
  "Building comprehensive insight",
  "Developing thoughtful response",
  "Creating meaningful connections",
  "Understanding the bigger picture",
  "Processing multiple perspectives",
  "Building deeper understanding",
  "Creating insightful analysis",
  "Developing nuanced perspective",
  "Understanding complex relationships",
  "Processing interconnected ideas",
  "Building comprehensive view",
  "Creating thoughtful synthesis",
  "Developing rich understanding",
  "Understanding profound connections",
  "Processing deep insights",
  "Building meaningful perspective",
  "Creating comprehensive understanding",
  "Developing profound insights",
  "Understanding complex patterns",
  "Processing intricate relationships",
  "Building sophisticated understanding",
  "Creating deep comprehension",
  "Developing advanced insights",
  "Understanding multifaceted connections",
  "Processing layered complexity",
  "Building holistic perspective",
  "Creating integrated understanding",
  "Developing complete picture",
  "Understanding universal patterns",
  "Processing fundamental principles",
  "Building transcendent insight",
  "Creating profound understanding",
  "Developing ultimate clarity",
  "Understanding essential truth",
  "Processing pure wisdom",
  "Building perfect comprehension",
  "Creating absolute understanding",
  "Almost ready with your insights",
  "Just finishing up the analysis",
  "Putting the final pieces together",
  "Getting ready to share what I found",
  "Final touches on your response"
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