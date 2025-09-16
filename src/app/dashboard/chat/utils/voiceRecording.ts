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
  private isVoiceActive = false;
  private baseTextBeforeVoice = '';
  private callbacks: VoiceRecordingCallbacks;
  private currentInput = '';
  private lastProcessedResultIndex = 0;
  private sessionFinalText = '';
  private accumulatedVoiceText = ''; // Track all voice text across sessions

  constructor(callbacks: VoiceRecordingCallbacks) {
    this.callbacks = callbacks;
  }

  static isVoiceSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  updateCurrentInput(text: string) {
    this.currentInput = text;
    // Update accumulated voice text if the current input contains our previous voice content
    // This ensures we don't lose voice transcriptions when input is updated externally
    if (!this.isVoiceActive && text.includes(this.accumulatedVoiceText)) {
      // Input contains our accumulated voice text, so it's still valid
    } else if (!this.isVoiceActive) {
      // Input doesn't contain our accumulated voice text, so reset accumulation
      // This can happen if user manually clears input or types new content
      this.accumulatedVoiceText = '';
    }
  }

  async startRecording(): Promise<void> {
    // Check if already recording
    if (this.isRecording || this.isVoiceActive) {
      console.log('Voice recording already active');
      return;
    }

    if (!VoiceRecordingManager.isVoiceSupported()) {
      this.callbacks.onError('Speech Recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      // Enhanced configuration for better performance
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;
      
      // Store the base text when starting voice input
      // Important: Preserve any existing accumulated voice text from previous sessions
      let existingNonVoiceText = this.currentInput;
      
      // If we have accumulated voice text, try to extract non-voice content
      if (this.accumulatedVoiceText) {
        // Handle case where accumulated text might be at the beginning
        if (this.currentInput.startsWith(this.accumulatedVoiceText)) {
          existingNonVoiceText = this.currentInput.slice(this.accumulatedVoiceText.length).trim();
        } 
        // Handle case where accumulated text might be anywhere in the input
        else if (this.currentInput.includes(this.accumulatedVoiceText)) {
          existingNonVoiceText = this.currentInput.replace(this.accumulatedVoiceText, '').trim();
        }
        // If accumulated text doesn't match current input, reset accumulation
        else {
          console.log('🧹 Accumulated text no longer matches input, resetting');
          this.accumulatedVoiceText = '';
          existingNonVoiceText = this.currentInput;
        }
      }
      
      this.baseTextBeforeVoice = existingNonVoiceText;
      this.sessionFinalText = '';
      this.lastProcessedResultIndex = 0;
      this.isVoiceActive = true;
      
      console.log('🎤 Starting recording with base text:', { 
        currentInput: this.currentInput,
        baseTextBeforeVoice: this.baseTextBeforeVoice,
        accumulatedVoiceText: this.accumulatedVoiceText,
        existingNonVoiceText 
      });
      
      recognitionInstance.onstart = () => {
        console.log('Voice recognition started');
        this.isRecording = true;
        this.callbacks.onRecordingStart();
      };
      
      recognitionInstance.onresult = (event: any) => {
        this.handleVoiceResult(event);
      };
      
      recognitionInstance.onerror = (event: any) => {
        this.handleVoiceError(event);
      };
      
      recognitionInstance.onend = () => {
        this.handleVoiceEnd(recognitionInstance);
      };
      
      this.recognition = recognitionInstance;
      recognitionInstance.start();
      
    } catch (error) {
      console.error('Failed to initialize voice recognition:', error);
      this.isRecording = false;
      this.isVoiceActive = false;
      this.callbacks.onError('Failed to initialize voice recognition');
    }
  }

  stopRecording(): void {
    // Prevent multiple stop calls
    if (!this.isVoiceActive && !this.isRecording && !this.recognition) {
      console.log('Voice recording already stopped, ignoring duplicate call');
      return;
    }
    
    console.log('Stopping voice recording');
    
    // CRITICAL: Before cleaning up, preserve any finalized voice text from this session
    if (this.sessionFinalText) {
      const spacer = this.accumulatedVoiceText ? ' ' : '';
      this.accumulatedVoiceText += spacer + this.sessionFinalText;
      console.log('🔄 Preserving session text:', { 
        sessionFinal: this.sessionFinalText,
        newAccumulated: this.accumulatedVoiceText 
      });
    }
    
    this.isVoiceActive = false;
    this.isRecording = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      this.recognition = null;
    }
    
    // Clean up session state but preserve accumulated voice text
    this.baseTextBeforeVoice = '';
    this.sessionFinalText = '';
    this.lastProcessedResultIndex = 0;
    // DO NOT reset accumulatedVoiceText - this preserves content across sessions
    
    this.callbacks.onRecordingStop();
  }

  private handleVoiceResult(event: any): void {
    let newFinalText = '';
    let interimTranscript = '';
    
    // Only process NEW results from the current result index onwards
    for (let i = this.lastProcessedResultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        newFinalText += transcript;
      }
    }
    
    // Get the latest interim result (always from the last result)
    if (event.results.length > 0) {
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult.isFinal) {
        interimTranscript = lastResult[0].transcript;
      }
    }
    
    // Update session final text with new final text
    if (newFinalText) {
      const spacer = this.sessionFinalText ? ' ' : '';
      this.sessionFinalText += spacer + newFinalText;
      this.lastProcessedResultIndex = event.results.length;
    }
    
    // Build the complete text: accumulated voice + base + session final + current interim
    const accumulatedSpaced = this.accumulatedVoiceText ? this.accumulatedVoiceText + ' ' : '';
    const baseSpaced = this.baseTextBeforeVoice ? this.baseTextBeforeVoice + ' ' : '';
    const sessionSpaced = this.sessionFinalText ? this.sessionFinalText + ' ' : '';
    const fullText = accumulatedSpaced + baseSpaced + sessionSpaced + interimTranscript;
    
    console.log('Voice transcription update:', { 
      accumulated: this.accumulatedVoiceText,
      base: this.baseTextBeforeVoice,
      sessionFinal: this.sessionFinalText,
      newFinal: newFinalText, 
      interim: interimTranscript,
      resultIndex: event.resultIndex,
      resultsLength: event.results.length,
      lastProcessed: this.lastProcessedResultIndex,
      combined: fullText
    });
    
    // Update input with real-time feedback
    this.callbacks.onTextUpdate(fullText.trim());
  }

  private handleVoiceError(event: any): void {
    const errorType = event.error;
    
    // Handle different error types
    switch (errorType) {
      case 'aborted':
        // This is normal when user manually stops recording - don't log as error
        console.log('Voice recognition was stopped by user');
        break;
      case 'no-speech':
        console.log('No speech detected, continuing to listen...');
        break;
      case 'audio-capture':
        console.error('Audio capture failed');
        this.stopRecording();
        this.callbacks.onError('Audio capture failed');
        break;
      case 'not-allowed':
        console.error('Microphone permission denied');
        this.stopRecording();
        this.callbacks.onError('Microphone permission denied');
        break;
      case 'network':
        console.error('Network error during recognition');
        this.stopRecording();
        this.callbacks.onError('Network error during recognition');
        break;
      case 'service-not-allowed':
        console.error('Speech recognition service not allowed');
        this.stopRecording();
        this.callbacks.onError('Speech recognition service not available');
        break;
      case 'bad-grammar':
        console.warn('Grammar error in speech recognition');
        // Don't stop recording for grammar errors
        break;
      case 'language-not-supported':
        console.error('Language not supported');
        this.stopRecording();
        this.callbacks.onError('Language not supported');
        break;
      default:
        console.error('Unknown recognition error:', errorType);
        this.stopRecording();
        this.callbacks.onError(`Recognition error: ${errorType}`);
        break;
    }
  }

  private handleVoiceEnd(recognitionInstance: any): void {
    console.log('Voice recognition ended');
    this.isRecording = false;
    
    // If voice is still supposed to be active, restart recognition after a brief delay
    if (this.isVoiceActive && this.recognition) {
      console.log('Restarting voice recognition for continuous listening');
      
      // Add a small delay to prevent rapid restart loops
      setTimeout(() => {
        if (this.isVoiceActive && this.recognition) {
          try {
            // Don't reset the tracking variables when restarting
            // Keep sessionFinalText and lastProcessedResultIndex for continuity
            recognitionInstance.start();
          } catch (error) {
            console.error('Failed to restart recognition:', error);
            this.isVoiceActive = false;
            this.recognition = null;
            this.callbacks.onRecordingStop();
          }
        }
      }, 100); // 100ms delay
    }
  }

  /**
   * Reset all accumulated voice text - call this when input is manually cleared
   */
  resetAccumulatedText(): void {
    this.accumulatedVoiceText = '';
    console.log('🧹 Reset accumulated voice text');
  }

  /**
   * Get the current accumulated voice text
   */
  getAccumulatedText(): string {
    return this.accumulatedVoiceText;
  }

  getState(): VoiceRecordingState {
    return {
      isRecording: this.isRecording,
      isVoiceActive: this.isVoiceActive,
      recognition: this.recognition,
      baseTextBeforeVoice: this.baseTextBeforeVoice,
      voiceSupported: VoiceRecordingManager.isVoiceSupported()
    };
  }

  cleanup(): void {
    this.stopRecording();
    // Don't reset accumulated text on cleanup - preserve for component remount
  }
}
