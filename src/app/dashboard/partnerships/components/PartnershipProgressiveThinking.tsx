'use client'

import React, { useEffect, useState } from 'react'
import { Mail, Users, Lightbulb, CheckCircle, FolderOpen, Inbox, Tag } from 'lucide-react'

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
    fun: [
      "Picking up on your organizing superpowers…",
      "Noticing how you like things sorted!",
      "Getting smarter from your label moves…"
    ]
  },
  {
    icon: <Inbox className="w-4 h-4" />,
    label: "Fetching new emails (skipping ones you've already seen)",
    fun: [
      "Only peeking at the fresh stuff!",
      "No repeats—just the latest opportunities.",
      "Zooming past anything you've already checked."
    ]
  },
  {
    icon: <Tag className="w-4 h-4" />,
    label: "Categorizing and organizing your inbox",
    fun: [
      "Sorting out the gems from the rest…",
      "Giving every email a home.",
      "Making sense of your inbox chaos!"
    ]
  },
  {
    icon: <FolderOpen className="w-4 h-4" />,
    label: "Saving new partnership opportunities to your dashboard",
    fun: [
      "Tucking new collabs into your dashboard!",
      "Your next big thing is getting filed…",
      "Saving the best for you!"
    ]
  }
];

export const PartnershipProgressiveThinking: React.FC<PartnershipProgressiveThinkingProps> = ({ 
  searchStatus = '', 
  isCompleted = false,
  progressData
}) => {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (isCompleted) return;
    if (stepIdx < steps.length - 1) {
      const timeout = setTimeout(() => setStepIdx(stepIdx + 1), 1500);
      return () => clearTimeout(timeout);
    }
  }, [stepIdx, isCompleted]);

  useEffect(() => {
    if (isCompleted) setStepIdx(steps.length - 1);
    if (!isCompleted && stepIdx === steps.length - 1) setStepIdx(0);
  }, [isCompleted]);

  // Friendly, human summary on completion
  const getCompletionMessage = () => {
    const learned = progressData?.learned_signals || 0;
    const found = progressData?.labeled_count || 0;
    const saved = progressData?.stored_count || 0;
    const processed = progressData?.processed_count || 0;

    if (processed === 0 && learned === 0) {
      return (
        <>
          <span className="font-medium text-foreground">All caught up!</span> <br />
          <span className="text-muted-foreground">No new emails to process right now, but your next big opportunity could be just one message away. Keep creating and connecting!</span>
        </>
      );
    }

    return (
      <>
        <span className="font-medium text-foreground">All done!</span> <br />
        <span className="text-muted-foreground">
          {learned > 0 && (
            <span className="block"> <Lightbulb className="inline w-4 h-4 mr-1" /> Learned from <b>{learned}</b> of your Gmail label changes.</span>
          )}
          {found > 0 && (
            <span className="block"> <Users className="inline w-4 h-4 mr-1" /> Found <b>{found}</b> new partnership opportunities.</span>
          )}
          {saved > 0 && (
            <span className="block"> <Mail className="inline w-4 h-4 mr-1" /> Saved <b>{saved}</b> opportunities to your dashboard.</span>
          )}
          {processed > 0 && (
            <span className="block"> <Mail className="inline w-4 h-4 mr-1" /> Processed <b>{processed}</b> new emails.</span>
          )}
          <span className="block mt-2">Thanks for being part of the journey—your next big thing is just around the corner!</span>
        </span>
      </>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {steps.map((step, idx) => {
          const isDone = isCompleted || idx < stepIdx;
          const isActive = !isCompleted && idx === stepIdx;
          const isFuture = idx > stepIdx && !isCompleted;
          return (
            <div
              key={step.label}
              className={`flex items-start gap-3 rounded-lg px-3 py-2 transition-all
                ${isDone ? 'bg-success/10 text-success' : isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                ${isActive ? 'shadow-md' : ''}
              `}
            >
              <div className="mt-0.5">
                {isDone ? <CheckCircle className="w-4 h-4 text-success" /> : isActive ? step.icon : step.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{step.label}</div>
                <div className="text-xs">
                  {step.fun[Math.floor(idx * 13 + stepIdx * 7) % step.fun.length]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {isCompleted && (
        <div className="flex items-start gap-2 text-sm mt-4">
          <CheckCircle className="w-5 h-5 text-success mt-0.5" />
          <div>{getCompletionMessage()}</div>
        </div>
      )}
    </div>
  )
} 