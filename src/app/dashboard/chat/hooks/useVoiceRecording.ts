import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceRecordingManager, VoiceRecordingCallbacks } from '../utils/voiceRecording';

interface UseVoiceRecordingProps {
  currentInput: string;
  onInputChange?: (value: string) => void;
  setCurrentInput: (value: string) => void;
  isRecordingRef: React.MutableRefObject<boolean>;
}

export function useVoiceRecording({ 
  currentInput, 
  onInputChange, 
  setCurrentInput,
  isRecordingRef
}: UseVoiceRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const voiceManagerRef = useRef<VoiceRecordingManager | null>(null);

  // Initialize voice support check
  useEffect(() => {
    setVoiceSupported(VoiceRecordingManager.isVoiceSupported());
  }, []);

  // Stable callback functions - simplified to avoid interference
  const stableOnTextUpdate = useCallback((text: string) => {
    setCurrentInput(text);
    // Call onInputChange for controlled components, but keep it simple
    onInputChange?.(text);
  }, [setCurrentInput, onInputChange]);

  const stableOnRecordingStart = useCallback(() => {
    console.log('🎤 Recording started - updating state to true');
    setIsRecording(true);
    isRecordingRef.current = true;
  }, [isRecordingRef]);

  const stableOnRecordingStop = useCallback(() => {
    console.log('🎤 Recording stopped - updating state to false');
    setIsRecording(false);
    isRecordingRef.current = false;
  }, [isRecordingRef]);

  const stableOnError = useCallback((error: string) => {
    console.error('Voice recording error:', error);
    setLastError(error);
    setIsRecording(false);
    isRecordingRef.current = false;
    
    // Clear error after a few seconds
    setTimeout(() => setLastError(null), 5000);
  }, [isRecordingRef]);

  // Create voice manager with callbacks ONCE
  useEffect(() => {
    console.log('🔧 Creating new VoiceRecordingManager');
    
    const callbacks: VoiceRecordingCallbacks = {
      onTextUpdate: stableOnTextUpdate,
      onRecordingStart: stableOnRecordingStart,
      onRecordingStop: stableOnRecordingStop,
      onError: stableOnError
    };

    // Clean up any existing manager first
    if (voiceManagerRef.current) {
      voiceManagerRef.current.cleanup();
    }

    voiceManagerRef.current = new VoiceRecordingManager(callbacks);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up VoiceRecordingManager');
      if (voiceManagerRef.current) {
        voiceManagerRef.current.cleanup();
        voiceManagerRef.current = null;
      }
    };
  }, []); // Empty dependency array - create only once

  // Update callbacks when they change
  useEffect(() => {
    if (voiceManagerRef.current) {
      // Update the manager's callbacks without recreating it
      const callbacks: VoiceRecordingCallbacks = {
        onTextUpdate: stableOnTextUpdate,
        onRecordingStart: stableOnRecordingStart,
        onRecordingStop: stableOnRecordingStop,
        onError: stableOnError
      };
      voiceManagerRef.current.updateCallbacks(callbacks);
    }
  }, [stableOnTextUpdate, stableOnRecordingStart, stableOnRecordingStop, stableOnError]);

  // Update current input in voice manager when it changes externally
  useEffect(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.updateCurrentInput(currentInput);
    }
  }, [currentInput]);

  const startRecording = useCallback(async () => {
    if (voiceManagerRef.current) {
      setLastError(null); // Clear any previous errors
      await voiceManagerRef.current.startRecording();
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.stopRecording();
    }
  }, []);

  // Toggle recording based on current state
  const toggleRecording = useCallback(async () => {
    console.log('🔄 Toggle recording - current state:', isRecording);
    if (isRecording) {
      console.log('🛑 Stopping recording...');
      stopRecording();
    } else {
      console.log('🎤 Starting recording...');
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetAccumulatedText = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.resetAccumulatedText();
    }
  }, []);

  const getAccumulatedText = useCallback(() => {
    if (voiceManagerRef.current) {
      return voiceManagerRef.current.getAccumulatedText();
    }
    return '';
  }, []);

  const clearAllText = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.clearAllText();
    }
  }, []);

  return {
    isRecording,
    voiceSupported,
    lastError,
    startRecording,
    stopRecording,
    toggleRecording,
    resetAccumulatedText,
    getAccumulatedText,
    clearAllText
  };
}
