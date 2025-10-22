'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, MessageSquare, Bug, Lightbulb, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { getApiKey } from '@/app/lib/api-helpers';
import { T } from '@/components/translation';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature_request' | 'general' | 'praise';

const feedbackTypeConfig = {
  bug: {
    label: 'Bug Report',
    icon: Bug,
    color: 'text-red-500',
    description: 'Something isn\'t working as expected'
  },
  feature_request: {
    label: 'Feature Request',
    icon: Lightbulb,
    color: 'text-blue-500',
    description: 'I have an idea for a new feature'
  },
  general: {
    label: 'General Feedback',
    icon: MessageSquare,
    color: 'text-gray-500',
    description: 'General thoughts or suggestions'
  },
  praise: {
    label: 'Praise',
    icon: Heart,
    color: 'text-green-500',
    description: 'Something I really like'
  }
};

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { firebaseUser } = useAuth();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('You are not authenticated. Please log in again.');
        return;
      }

      const formData = new FormData();
      formData.append('type', feedbackType);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('userEmail', firebaseUser?.email || 'anonymous');
      formData.append('userName', firebaseUser?.displayName || 'Anonymous');
      formData.append('page', window.location.pathname);
      formData.append('userAgent', navigator.userAgent);
      formData.append('timestamp', Date.now().toString());

      // Add screenshots
      screenshots.forEach((file, index) => {
        formData.append(`screenshot_${index}`, file);
      });

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setScreenshots([]);
    setFeedbackType('general');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length + screenshots.length > 3) {
      setError('Maximum 3 screenshots allowed');
      return;
    }

    setScreenshots(prev => [...prev, ...imageFiles]);
    setError(null);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentConfig = () => feedbackTypeConfig[feedbackType];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <T context="feedback.title">Give Feedback</T>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label><T context="feedback.type.label">What type of feedback is this?</T></Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(feedbackTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setFeedbackType(type as FeedbackType)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      feedbackType === type
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <div className="text-left">
                        <div className="font-medium">
                          <T context={`feedback.type.${type}.label`}>{config.label}</T>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <T context={`feedback.type.${type}.description`}>{config.description}</T>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="feedback-title"><T context="feedback.title.label">Title *</T></Label>
            <input
              id="feedback-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={<T context="feedback.title.placeholder">Brief summary of your feedback</T>}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="feedback-description"><T context="feedback.description.label">Description *</T></Label>
            <Textarea
              id="feedback-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={<T context="feedback.description.placeholder">Please provide detailed feedback. What happened? What did you expect? How can we improve?</T>}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-3">
            <Label><T context="feedback.screenshots.label">Screenshots (optional)</T></Label>
            <div className="space-y-3">
              {/* Upload Button */}
              {screenshots.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <T context="feedback.screenshots.upload">Upload Screenshot</T>
                </Button>
              )}
              
              <input
                title="Upload screenshots"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Screenshot Preview */}
              {screenshots.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <T context="feedback.screenshots.count">{screenshots.length}/3 screenshots</T>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {screenshots.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <button
                          title="Remove screenshot"
                          onClick={() => removeScreenshot(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                title="Close"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <Heart className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">
                <T context="feedback.success">Thank you for your feedback! We'll review it shortly.</T>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              <T context="feedback.cancel">Cancel</T>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <T context="feedback.submitting">Submitting...</T>
                </>
              ) : (
                <T context="feedback.submit">Submit Feedback</T>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 