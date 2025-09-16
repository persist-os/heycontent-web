export interface VoiceRecordingState {
  isRecording: boolean;
  isVoiceActive: boolean;
  recognition: any | null;
  baseTextBeforeVoice: string;
  voiceSupported: boolean;
}

export interface VoiceRecordingCallbacks {
  onTextUpdate: (text: string) => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onError: (error: string) => void;
}

export class VoiceRecordingManager {
  private recognition: any = null;
  private isRecording = false;
  private callbacks: VoiceRecordingCallbacks;
  private currentSessionText = ''; // Text from current recording session only
  private allSessionsText = ''; // Accumulated text from all sessions
  private sessionFinalized = false; // Prevent double finalization

  constructor(callbacks: VoiceRecordingCallbacks) {
    this.callbacks = callbacks;
  }

  updateCallbacks(callbacks: VoiceRecordingCallbacks): void {
    this.callbacks = callbacks;
  }

  static isVoiceSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  updateCurrentInput(text: string) {
    // If not recording, this is external input change - preserve it as base
    if (!this.isRecording) {
      this.allSessionsText = text;
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording || this.recognition) {
      console.log('Voice recording already active');
      return;
    }

    if (!VoiceRecordingManager.isVoiceSupported()) {
      this.callbacks.onError('Speech Recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      // Prevent automatic stopping on silence
      if ('webkitSpeechRecognition' in window) {
        this.recognition.webkitSpeechRecognition = true;
      }
      
      // Start fresh session - don't accumulate from previous sessions YET
      this.currentSessionText = '';
      this.sessionFinalized = false; // Reset finalization flag
      
      this.recognition.onstart = () => {
        this.isRecording = true;
        this.callbacks.onRecordingStart();
      };
      
      this.recognition.onresult = (event: any) => {
        try {
          // Rebuild current session from scratch each time to avoid confusion
          let sessionFinalText = '';
          let sessionInterimText = '';
          
          // Get all final results from this session
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              sessionFinalText += transcript + ' ';
            } else {
              sessionInterimText += transcript;
            }
          }
          
          // Update current session (final only, interim is temporary)
          this.currentSessionText = sessionFinalText;
          
          // Combine: previous sessions + current session final + current interim
          const fullText = this.allSessionsText + 
                          (this.allSessionsText && (sessionFinalText || sessionInterimText) ? ' ' : '') + 
                          sessionFinalText + sessionInterimText;
          
          this.callbacks.onTextUpdate(fullText.trim());
        } catch (error) {
          console.error('Error processing voice result:', error);
          this.forceStop();
        }
      };
      
      this.recognition.onerror = (event: any) => {
        const errorType = event.error;
        
        // Handle different error types - some are recoverable
        switch (errorType) {
          case 'no-speech':
            // Don't stop for no-speech - user might just be pausing
            console.log('No speech detected, continuing...');
            return;
          case 'aborted':
            // Normal when user stops manually
            break;
          case 'not-allowed':
          case 'audio-capture':
          case 'network':
            // Critical errors - stop and show error
            this.forceStop();
            this.callbacks.onError(`Voice recognition error: ${errorType}`);
            return;
          default:
            console.warn('Voice recognition warning:', errorType);
            // For other errors, continue recording
            return;
        }
        
        this.forceStop();
      };
      
      this.recognition.onend = () => {
        // Only finalize if we haven't already done so
        if (!this.sessionFinalized) {
          this.finalizeSession();
        }
        this.forceStop();
      };
      
      this.recognition.start();
      
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.forceStop();
      this.callbacks.onError('Failed to start voice recognition');
    }
  }

  stopRecording(): void {
    this.finalizeSession();
    this.forceStop();
  }

  private finalizeSession(): void {
    // Prevent double finalization
    if (this.sessionFinalized) {
      return;
    }
    
    // Move current session text to accumulated text
    if (this.currentSessionText.trim()) {
      this.allSessionsText = (this.allSessionsText + 
                            (this.allSessionsText && this.currentSessionText ? ' ' : '') + 
                            this.currentSessionText).trim();
    }
    this.currentSessionText = '';
    this.sessionFinalized = true;
  }

  private forceStop(): void {
    this.isRecording = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition.abort();
      } catch (e) {
        // Ignore errors
      }
      this.recognition = null;
    }
    
    try {
      this.callbacks.onRecordingStop();
    } catch (e) {
      // Ignore callback errors
    }
  }

  getState(): VoiceRecordingState {
    return {
      isRecording: this.isRecording,
      isVoiceActive: this.isRecording,
      recognition: this.recognition,
      baseTextBeforeVoice: this.allSessionsText,
      voiceSupported: VoiceRecordingManager.isVoiceSupported()
    };
  }

  cleanup(): void {
    this.forceStop();
  }

  resetAccumulatedText(): void {
    this.allSessionsText = '';
    this.currentSessionText = '';
  }

  getAccumulatedText(): string {
    return this.allSessionsText;
  }

  clearAllText(): void {
    this.allSessionsText = '';
    this.currentSessionText = '';
  }
}

