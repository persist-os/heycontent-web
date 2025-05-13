"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, Mic, Square, Pause, Play } from "lucide-react";

interface RecordingControlsProps {
  onRecordingComplete: (blob: Blob) => void;
}

export function RecordingControls({ onRecordingComplete }: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        onRecordingComplete(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // TODO: Show error message to user
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Video Preview */}
      <div className="flex-1 bg-black relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <Video className="w-12 h-12 mx-auto mb-2" />
              <p>Camera preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t flex justify-center gap-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                onClick={resumeRecording}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            ) : (
              <Button
                onClick={pauseRecording}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );
} 