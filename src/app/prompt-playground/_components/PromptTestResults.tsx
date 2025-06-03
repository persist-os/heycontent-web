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
  onSaveFeedback: () => void;
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
                  <label className="text-sm font-medium mb-2 block">
                    Feedback & Notes
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Add your feedback, suggestions, or notes..."
                    className="min-h-20"
                  />
                </div>
                <Button 
                  onClick={onSaveFeedback}
                  disabled={disabled}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Feedback
                </Button>
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