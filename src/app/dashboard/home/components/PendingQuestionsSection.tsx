'use client'

import React from 'react'
import { MessageCircle, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PendingQuestion {
  _id: string
  projectId: string
  projectName: string
  widgetId: string
  familyName: string
  question: string
  createdAt: number
}

interface PendingQuestionsSectionProps {
  questions: PendingQuestion[] | undefined
  onQuestionClick: (projectId: string) => void
}

/**
 * PendingQuestionsSection - Shows pending family questions from all projects
 * 
 * Displays questions that families have asked the user. Click switches to that
 * project's conversation where the question already exists as an AI message.
 * Like a text thread notification - click to see the conversation.
 */
export function PendingQuestionsSection({ questions, onQuestionClick }: PendingQuestionsSectionProps) {

  // Loading state
  if (questions === undefined) {
    return null  // Don't show section while loading
  }

  // Empty state with explanation
  const hasQuestions = questions && questions.length > 0

  return (
    <div className="space-y-4">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">
            Pending Questions
          </h2>
          {hasQuestions && (
            <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {questions.length}
            </div>
          )}
        </div>
      </div>
      
      {/* Question Items or Empty State */}
      {hasQuestions ? (
        <div className="space-y-3">
          {questions.map((question) => (
            <button
              key={question._id}
              onClick={() => onQuestionClick(question.projectId)}
              className="w-full p-4 rounded-xl bg-card/50 hover:bg-card border border-border hover:border-primary/30 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Family name */}
                  <p className="text-sm font-medium text-foreground mb-1">
                    {question.familyName}
                  </p>
                  
                  {/* Question */}
                  <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
                    {question.question}
                  </p>
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{question.projectName}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(question.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>
                
                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Explanation */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground">
              When your project families need more information to complete their work, their questions will appear here. 
              Click on a question to answer it in the project conversation.
            </p>
          </div>
          
          {/* Example/Placeholder Questions */}
          <div className="space-y-3 opacity-40">
            <div className="w-full p-4 rounded-xl bg-card/50 border border-dashed border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Timeline Architect
                  </p>
                  <p className="text-sm text-foreground/80 mb-2">
                    What's the target completion date for this project?
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Example Project</span>
                    <span>•</span>
                    <span>No pending questions yet</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full p-4 rounded-xl bg-card/50 border border-dashed border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Budget Analyst
                  </p>
                  <p className="text-sm text-foreground/80 mb-2">
                    Do you have a preferred budget range for this initiative?
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Example Project</span>
                    <span>•</span>
                    <span>No pending questions yet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
