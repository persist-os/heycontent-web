import { useState, useCallback, useRef } from "react";
import { VeedClient } from "@/lib/studio/veed-client";
import { AICoach } from "@/lib/studio/ai-coach";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  format: "vertical" | "horizontal" | "square";
  teleprompter: {
    enabled: boolean;
    text: string;
    speed: number;
  };
  vocalCoach: {
    enabled: boolean;
    feedback: Array<{
      type: "pacing" | "clarity" | "emphasis" | "energy";
      message: string;
      timestamp: number;
    }>;
  };
  mediaStream: MediaStream | null;
  recordingTime: number;
  error: string | null;
}

export function useRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    format: "horizontal",
    teleprompter: {
      enabled: false,
      text: "",
      speed: 1,
    },
    vocalCoach: {
      enabled: false,
      feedback: [],
    },
    mediaStream: null,
    recordingTime: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const veedClient = useRef(new VeedClient());
  const aiCoach = useRef(new AICoach());

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: state.format === "vertical" ? 1080 : 1920,
          height: state.format === "vertical" ? 1920 : 1080,
        },
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const project = await veedClient.current.createProject("New Recording");
        await veedClient.current.uploadMedia(project.id, new File([blob], "recording.webm"));
        
        if (state.vocalCoach.enabled) {
          const audioContext = new AudioContext();
          const audioBuffer = await blob.arrayBuffer();
          const feedback = await aiCoach.current.analyzeSpeech(audioBuffer);
          
          setState(prev => ({
            ...prev,
            vocalCoach: {
              ...prev.vocalCoach,
              feedback: [...prev.vocalCoach.feedback, ...feedback],
            },
          }));
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setState(prev => ({
        ...prev,
        isRecording: true,
        mediaStream: stream,
        error: null,
      }));

      // Start timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }));
      }, 1000);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to start recording",
      }));
    }
  }, [state.format]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      state.mediaStream?.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        mediaStream: null,
      }));
    }
  }, [state.isRecording, state.mediaStream]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setState(prev => ({
        ...prev,
        isPaused: true,
      }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }));
      }, 1000);
      setState(prev => ({
        ...prev,
        isPaused: false,
      }));
    }
  }, [state.isRecording, state.isPaused]);

  const setFormat = useCallback((format: "vertical" | "horizontal" | "square") => {
    setState(prev => ({
      ...prev,
      format,
    }));
  }, []);

  const toggleTeleprompter = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      teleprompter: {
        ...prev.teleprompter,
        enabled,
      },
    }));
  }, []);

  const setTeleprompterText = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      teleprompter: {
        ...prev.teleprompter,
        text,
      },
    }));
  }, []);

  const setTeleprompterSpeed = useCallback((speed: number) => {
    setState(prev => ({
      ...prev,
      teleprompter: {
        ...prev.teleprompter,
        speed,
      },
    }));
  }, []);

  const toggleVocalCoach = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      vocalCoach: {
        ...prev.vocalCoach,
        enabled,
      },
    }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    setFormat,
    toggleTeleprompter,
    setTeleprompterText,
    setTeleprompterSpeed,
    toggleVocalCoach,
  };
} 