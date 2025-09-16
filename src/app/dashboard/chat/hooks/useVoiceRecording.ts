import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceRecordingManager, VoiceRecordingCallbacks } from '../utils/voiceRecording';

interface UseVoiceRecordingProps {
  currentInput: string;
  onInputChange?: (value: string) => void;
  setCurrentInput: (value: string) => void;
}

export function useVoiceRecording({ 
  currentInput, 
  onInputChange, 
  setCurrentInput 
}: UseVoiceRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const voiceManagerRef = useRef<VoiceRecordingManager | null>(null);

  // Initialize voice support check
  useEffect(() => {
    setVoiceSupported(VoiceRecordingManager.isVoiceSupported());
  }, []);

  // Stable callback functions
  const stableOnTextUpdate = useCallback((text: string) => {
    setCurrentInput(text);
    if (onInputChange) {
      onInputChange(text);
    }
  }, [setCurrentInput, onInputChange]);

  const stableOnRecordingStart = useCallback(() => {
    console.log('🎤 Recording started - updating state to true');
    setIsRecording(true);
  }, []);

  const stableOnRecordingStop = useCallback(() => {
    console.log('🎤 Recording stopped - updating state to false');
    setIsRecording(false);
  }, []);

  const stableOnError = useCallback((error: string) => {
    console.error('Voice recording error:', error);
    setLastError(error);
    setIsRecording(false);
    
    // Clear error after a few seconds
    setTimeout(() => setLastError(null), 5000);
  }, []);

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
      console.log('📝 Updating voice manager callbacks');
    }
  }, [stableOnTextUpdate, stableOnRecordingStart, stableOnRecordingStop, stableOnError]);

  // Update current input in voice manager when it changes
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

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
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

  return {
    isRecording,
    voiceSupported,
    lastError,
    startRecording,
    stopRecording,
    toggleRecording,
    resetAccumulatedText,
    getAccumulatedText
  };
}
