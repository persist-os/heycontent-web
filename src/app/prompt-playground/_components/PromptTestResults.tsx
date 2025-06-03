import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Save, Target } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface PromptTestResultsProps {
  testOutput: string;
  isLoading: boolean;
  currentRating: number;
  setCurrentRating: (v: number) => void;
  feedback: string;
  setFeedback: (v: string) => void;
  onSaveFeedback: () => Promise<void>;
  feedbackLoading?: boolean;
  feedbackError?: string | null;
  feedbackSuccess?: boolean;

  disabled: boolean;
}

export function PromptTestResults({
  testOutput,
  isLoading,
  currentRating,
  setCurrentRating,
  feedback,
  setFeedback,
  onSaveFeedback,
  feedbackLoading,
  feedbackError,
  feedbackSuccess,
  disabled
}: PromptTestResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Test Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Generating content...</span>
          </div>
        ) : testOutput ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Generated Output:</h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {testOutput}
              </pre>
            </div>
            {/* Rating & Feedback */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Rate this output:</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Rating:</span>
                  <StarRating
                    value={currentRating}
                    onChange={setCurrentRating}
                  />
                  <span className="text-sm text-gray-600">
                    {currentRating > 0 && `${currentRating}/5`}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                    Feedback & Notes <span className="text-red-500">*</span>
                  </label>
                  {(!feedback || feedback.trim().length === 0) && !feedbackSuccess && (
                    <div className="text-xs text-gray-600 mb-2">Feedback is required to submit.</div>
                  )}
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="(Required) Add your feedback, suggestions, or notes..."
                    className={`min-h-20${feedbackError === 'Feedback is required.' ? ' border-red-500 ring-1 ring-red-400' : ''}`}
                  />
                  {feedbackError === 'Feedback is required.' && (
                    <div className="text-xs text-red-500 mt-1">Feedback is required.</div>
                  )}
                </div>
                <Button 
                  onClick={onSaveFeedback}
                  disabled={disabled || feedbackLoading}
                  className="w-full"
                >
                  {feedbackLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  {feedbackLoading ? 'Saving...' : 'Save Feedback'}
                </Button>
                {feedbackError && (
                  <div className="text-sm text-red-500 mt-2">{feedbackError}</div>
                )}
                {feedbackSuccess && (
                  <div className="text-sm text-green-600 mt-2">Feedback submitted successfully!</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Click "Test Prompt" to see generated content</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 