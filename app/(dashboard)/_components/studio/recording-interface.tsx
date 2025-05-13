"use client";

import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordingConfig } from "@/app/types/studio";
import { RecordingControls } from "./recording-controls";
import { useState } from "react";

interface RecordingInterfaceProps {
  config: RecordingConfig;
  onConfigChange: (config: RecordingConfig) => void;
  onStartRecording: () => void;
}

export function RecordingInterface({
  config,
  onConfigChange,
  onStartRecording
}: RecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob);
    setIsRecording(false);
    // TODO: Handle the recorded video (e.g., upload to server, show preview, etc.)
    console.log("Recording completed:", blob);
  };

  if (isRecording) {
    return <RecordingControls onRecordingComplete={handleRecordingComplete} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Format Preview */}
      <div className={`flex-1 p-4 ${
        config.format === "vertical" ? "aspect-[9/16]" :
        config.format === "horizontal" ? "aspect-[16/9]" :
        config.format === "square" ? "aspect-square" :
        "aspect-video"
      } bg-gray-100 dark:bg-gray-800 rounded-lg m-4 relative`}>
        {config.format && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                {config.format === "vertical" ? "Vertical (9:16)" :
                 config.format === "horizontal" ? "Horizontal (16:9)" :
                 "Square (1:1)"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t">
        {config.format && (
          <div className="space-y-4">
            {/* Teleprompter */}
            {config.teleprompter?.enabled && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Teleprompter</h4>
                <textarea
                  className="w-full h-24 p-2 border rounded-md"
                  placeholder="Enter your script here..."
                  value={config.teleprompter.text}
                  onChange={(e) => onConfigChange({
                    ...config,
                    teleprompter: {
                      ...config.teleprompter!,
                      text: e.target.value
                    }
                  })}
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm">Speed:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.teleprompter.speed}
                    onChange={(e) => onConfigChange({
                      ...config,
                      teleprompter: {
                        ...config.teleprompter!,
                        speed: parseFloat(e.target.value)
                      }
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {/* Vocal Coach */}
            {config.vocalCoach?.enabled && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">AI Vocal Coach</h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {config.vocalCoach.tips.length > 0
                      ? config.vocalCoach.tips[0]
                      : "I'll provide real-time feedback on your delivery"}
                  </p>
                </div>
              </div>
            )}

            {/* Record Button */}
            <Button
              className="w-full"
              onClick={() => setIsRecording(true)}
            >
              Start Recording
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 