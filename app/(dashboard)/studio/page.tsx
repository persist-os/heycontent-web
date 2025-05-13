"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/app/(dashboard)/_components/studio/chat-interface";
import { RecordingInterface } from "@/app/(dashboard)/_components/studio/recording-interface";
import { MediaLibrary } from "@/app/(dashboard)/_components/studio/media-library";
import { RecordingConfig } from "@/app/types/studio";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Timeline } from "../../../src/components/ui/timeline";

interface Template {
  id: string;
  name: string;
  type: "thumbnail" | "video" | "document";
  thumbnail: string;
  description: string;
  date: string;
}

// Timeline clip types
type TimelineClip = {
  id: string;
  type: 'video' | 'audio' | 'effect';
  start: number; // seconds
  end: number;   // seconds
  src?: string;  // for video/audio
  effectType?: string; // for effects
  thumbnail?: string; // for video
};

export default function StudioPage() {
  const [previewContent, setPreviewContent] = useState<{
    type: "recording" | "editing" | "thumbnail" | null;
    data: RecordingConfig | null;
  }>({
    type: null,
    data: null
  });

  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([
    // Example initial clips
    { id: 'v1', type: 'video', start: 0, end: 5, src: '', thumbnail: '' },
    { id: 'a1', type: 'audio', start: 0, end: 9, src: '' },
    { id: 'e1', type: 'effect', start: 2, end: 4, effectType: 'fade-in' },
  ]);

  const handleStartRecording = () => {
    setPreviewContent({
      type: "recording",
      data: {
        format: "horizontal",
        teleprompter: {
          enabled: false,
          text: "",
          speed: 1
        },
        vocalCoach: {
          enabled: false,
          tips: []
        }
      }
    });
  };

  const handleStartEditing = () => {
    setPreviewContent({
      type: "editing",
      data: null
    });
  };

  const handleStartThumbnail = () => {
    setPreviewContent({
      type: "thumbnail",
      data: null
    });
  };

  const handleRecordingConfigChange = (config: RecordingConfig) => {
    setPreviewContent(prev => ({
      ...prev,
      data: config
    }));
  };

  const handleMediaSelect = (media: any) => {
    // TODO: Handle media selection
    console.log("Selected media:", media);
  };

  const handleTemplateSelect = (template: Template) => {
    // TODO: Handle template selection
    console.log("Selected template:", template);
    
    // Set the appropriate preview content based on template type
    switch (template.type) {
      case "thumbnail":
        setPreviewContent({
          type: "thumbnail",
          data: null
        });
        break;
      case "video":
        setPreviewContent({
          type: "editing",
          data: null
        });
        break;
      case "document":
        // Handle document template
        break;
    }
  };

  const handleUploadMedia = () => {
    // TODO: Implement media upload
    console.log("Upload media clicked");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 border-b flex items-center px-4">
        <div className="w-8" /> {/* Spacer for menu button */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">HeyContent Studio</h1>
          <p className="text-sm text-gray-500 hidden md:block">
            Your AI-powered content creation assistant
          </p>
        </div>
        <div className="w-8" /> {/* Spacer for balance */}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* Media Library */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full">
              <MediaLibrary 
                onSelectMedia={handleMediaSelect}
                onSelectTemplate={handleTemplateSelect}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors" />

          {/* Preview/Workspace */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full">
              {previewContent.type === "recording" && previewContent.data && (
                <RecordingInterface
                  config={previewContent.data}
                  onConfigChange={handleRecordingConfigChange}
                  onStartRecording={() => {
                    // TODO: Implement actual recording
                    console.log("Starting recording with config:", previewContent.data);
                  }}
                />
              )}
              {previewContent.type === "editing" && (
                <div className="h-full flex flex-col items-center justify-start">
                  {/* Player/Preview placeholder */}
                  <div className="w-full flex-1 flex items-center justify-center">
                    <p className="text-gray-500">[Player/Preview Area]</p>
                  </div>
                  {/* Timeline below the player */}
                  <Timeline clips={timelineClips} setClips={setTimelineClips} />
                </div>
              )}
              {previewContent.type === "thumbnail" && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Thumbnail creator coming soon...</p>
                </div>
              )}
              {!previewContent.type && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Select an option to get started</p>
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors" />

          {/* Chat Interface */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full">
              <ChatInterface
                onStartRecording={handleStartRecording}
                onStartEditing={handleStartEditing}
                onStartThumbnail={handleStartThumbnail}
                onUploadMedia={handleUploadMedia}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
} 