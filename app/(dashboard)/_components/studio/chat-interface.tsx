"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./message-bubble";
import { ContentSuggestions } from "./content-suggestions";
import { BrainstormSuggestions } from "./brainstorm-suggestions";
import { ContentIdeas } from "./content-ideas";
import { 
  Mic, 
  Edit, 
  Image, 
  Sparkles, 
  Upload, 
  AtSign, 
  Hash, 
  Video, 
  File, 
  MessageSquare,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: boolean;
  component?: "content-suggestions" | "brainstorm-suggestions" | "content-ideas";
  data?: any;
  preview?: {
    type: "recording" | "editing" | "thumbnail";
    config: any;
  };
}

interface ChatInterfaceProps {
  onStartRecording: () => void;
  onStartEditing: () => void;
  onStartThumbnail: () => void;
  onUploadMedia: () => void;
}

interface MentionItem {
  id: string;
  type: "media" | "template" | "note" | "conversation";
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ChatInterface({
  onStartRecording,
  onStartEditing,
  onStartThumbnail,
  onUploadMedia
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome to HeyContent Studio! I'm your AI production assistant. Would you like to brainstorm ideas or start creating content right away?",
      timestamp: new Date(),
      suggestions: true,
      component: "content-suggestions"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionType, setMentionType] = useState<"@" | "#">("@");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [contextItems, setContextItems] = useState<MentionItem[]>([]);
  // Mock changes for progress tracking
  const [pendingChanges, setPendingChanges] = useState([
    { id: 'change-1', type: 'add', description: 'Added media file: intro-video.mp4' },
    { id: 'change-2', type: 'edit', description: 'Removed background from video' },
    { id: 'change-3', type: 'edit', description: 'Added flowers to video' },
    { id: 'change-4', type: 'add', description: 'Added transition: Fade In' },
    { id: 'change-5', type: 'edit', description: 'Changed caption text on Scene 2' },
    { id: 'change-6', type: 'edit', description: 'Added effect: Blur to intro-video.mp4' },
    { id: 'change-7', type: 'remove', description: 'Removed template: YouTube Thumbnail Template' },
  ]);
  const [showChangesPanel, setShowChangesPanel] = useState(false);

  // Helper to register a change
  const registerChange = (type: 'add' | 'edit' | 'remove', description: string) => {
    setPendingChanges(prev => [
      ...prev,
      {
        id: `change-${Date.now()}`,
        type,
        description,
      }
    ]);
  };

  // @ for notes/conversations
  const mentionableNotesAndConversations: MentionItem[] = [
    {
      id: "note-1",
      type: "note",
      name: "Content Strategy",
      description: "Last edited 2 days ago",
      icon: <File className="w-4 h-4" />
    },
    {
      id: "conv-1",
      type: "conversation",
      name: "Marketing Team Discussion",
      description: "Conversation history",
      icon: <MessageSquare className="w-4 h-4" />
    }
  ];

  // # for media/templates
  const mentionableMediaAndTemplates: MentionItem[] = [
    {
      id: "media-1",
      type: "media",
      name: "thumbnail-1.jpg",
      description: "Image • 2.4 MB",
      icon: <Image className="w-4 h-4" />
    },
    {
      id: "media-2",
      type: "media",
      name: "intro-video.mp4",
      description: "Video • 45.8 MB",
      icon: <Video className="w-4 h-4" />
    },
    {
      id: "template-1",
      type: "template",
      name: "YouTube Thumbnail Template",
      description: "16:9 ratio template",
      icon: <Image className="w-4 h-4" />
    }
  ];

  const filteredMentions = (mentionType === "@"
    ? mentionableNotesAndConversations
    : mentionableMediaAndTemplates
  ).filter(item => {
    const query = mentionQuery.toLowerCase();
    return item.name.toLowerCase().includes(query) ||
           (item.description?.toLowerCase().includes(query) ?? false);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setInput(value);
    setCursorPosition(cursorPos);
    
    // Check for @ or # triggers
    const lastTriggerIndex = Math.max(
      value.lastIndexOf("@", cursorPos),
      value.lastIndexOf("#", cursorPos)
    );

    if (lastTriggerIndex !== -1 && lastTriggerIndex < cursorPos) {
      const trigger = value[lastTriggerIndex];
      setMentionType(trigger as "@" | "#");
      setShowMentions(true);
      const query = value.slice(lastTriggerIndex + 1, cursorPos);
      setMentionQuery(query);
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorPos = e.currentTarget.selectionStart || 0;
    setCursorPosition(cursorPos);
  };

  const handleMentionSelect = (item: MentionItem) => {
    const lastTriggerIndex = input.lastIndexOf(mentionType, cursorPosition);
    if (lastTriggerIndex !== -1) {
      const newInput = input.slice(0, lastTriggerIndex) + 
                      `${mentionType}${item.name} ` + 
                      input.slice(cursorPosition);
      setInput(newInput);
      setShowMentions(false);
      setMentionQuery("");
      // Add to context if not already present
      setContextItems((prev) => prev.find((c) => c.id === item.id) ? prev : [...prev, item]);
      // Focus back on input and set cursor position after the inserted mention
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = lastTriggerIndex + mentionType.length + item.name.length + 1;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleRemoveContext = (id: string) => {
    setContextItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand you want to create content. Would you like to start recording, edit existing content, or create a thumbnail?",
        timestamp: new Date(),
        suggestions: true,
        component: "content-suggestions"
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSuggestionSelect = (type: "recording" | "editing" | "thumbnail" | "brainstorm" | "upload") => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: type === "recording" ? "I want to start recording" :
              type === "editing" ? "I want to edit content" :
              type === "thumbnail" ? "I want to create a thumbnail" :
              type === "upload" ? "I want to upload media" :
              "I need help brainstorming ideas",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      let response: Message;
      
      switch (type) {
        case "recording":
          response = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Let's set up your recording. What format would you like to use?",
            timestamp: new Date(),
            suggestions: true,
            component: "content-suggestions",
            preview: {
              type: "recording",
              config: {
                format: "horizontal",
                teleprompter: false,
                vocalCoach: false
              }
            }
          };
          onStartRecording(response.preview.config);
          break;
        case "editing":
          response = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "What would you like to edit? I can help with trimming, adding effects, or creating a series.",
            timestamp: new Date(),
            suggestions: true,
            component: "content-suggestions",
            preview: {
              type: "editing",
              config: {
                mode: "trim",
                effects: [],
                series: false
              }
            }
          };
          onStartEditing(response.preview.config);
          break;
        case "thumbnail":
          response = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Let's create an eye-catching thumbnail. What style are you looking for?",
            timestamp: new Date(),
            suggestions: true,
            component: "content-suggestions",
            preview: {
              type: "thumbnail",
              config: {
                style: "modern",
                elements: []
              }
            }
          };
          onStartThumbnail(response.preview.config);
          break;
        case "upload":
          response = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Upload your media to get started. I'll help you edit it right away.",
            timestamp: new Date()
          };
          onUploadMedia();
          break;
        case "brainstorm":
          response = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I'll help you brainstorm content ideas. What's your niche or topic?",
            timestamp: new Date(),
            suggestions: true,
            component: "brainstorm-suggestions"
          };
          break;
      }

      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1000);
  };

  const handleTopicSelect = (topic: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `I want to create content about ${topic}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response with content ideas
    setTimeout(() => {
      const ideas = [
        {
          id: "1",
          title: "Getting Started Guide",
          description: "A comprehensive guide for beginners in this topic",
          format: "video" as const,
          platforms: ["YouTube", "LinkedIn"]
        },
        {
          id: "2",
          title: "Quick Tips Series",
          description: "Short, actionable tips that viewers can implement immediately",
          format: "short" as const,
          platforms: ["TikTok", "Instagram Reels"]
        },
        {
          id: "3",
          title: "Expert Interview Series",
          description: "Interviews with industry experts sharing their insights",
          format: "series" as const,
          platforms: ["YouTube", "Spotify"]
        }
      ];

      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Here are some content ideas for your topic. Which one interests you?",
        timestamp: new Date(),
        suggestions: true,
        component: "content-ideas",
        data: { ideas }
      };

      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1000);
  };

  const handleIdeaSelect = (idea: any) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `I want to create: ${idea.title}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Great choice! Let's start creating your content. Would you like to begin recording or upload existing media?",
        timestamp: new Date(),
        suggestions: true,
        component: "content-suggestions"
      };

      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1000);
  };

  const handleAcceptChange = (id: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== id));
    // You can add logic here to apply the change
  };
  const handleRejectChange = (id: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== id));
    // You can add logic here to revert the change
  };

  // Example: After applying an edit (e.g., removing background)
  const handleApplyEdit = (editType: string) => {
    // ...apply the edit logic...
    if (editType === 'remove-background') {
      registerChange('edit', 'Removed background from video');
    }
    if (editType === 'add-flowers') {
      registerChange('edit', 'Added flowers to video');
    }
  };

  // Example: After adding media
  const handleUploadMediaWithChange = (fileName: string) => {
    // ...upload logic...
    registerChange('add', `Added media file: ${fileName}`);
  };

  // Example: After applying a transition
  const handleAddTransition = (transitionName: string) => {
    // ...apply transition logic...
    registerChange('add', `Added transition: ${transitionName}`);
  };

  // Example: After editing a caption
  const handleEditCaption = (scene: string, newText: string) => {
    // ...edit caption logic...
    registerChange('edit', `Changed caption text on ${scene}`);
  };

  // Example: After adding an effect
  const handleAddEffect = (effectName: string, target: string) => {
    // ...apply effect logic...
    registerChange('edit', `Added effect: ${effectName} to ${target}`);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <MessageBubble
                message={message}
                isLoading={isLoading && message.id === messages[messages.length - 1].id}
              />
              {message.suggestions && message.role === "assistant" && (
                <div className="mt-2">
                  {message.component === "content-suggestions" && (
                    <ContentSuggestions onSelect={handleSuggestionSelect} />
                  )}
                  {message.component === "brainstorm-suggestions" && (
                    <BrainstormSuggestions
                      onTopicSelect={handleTopicSelect}
                      onCustomTopic={handleTopicSelect}
                    />
                  )}
                  {message.component === "content-ideas" && message.data?.ideas && (
                    <ContentIdeas
                      ideas={message.data.ideas}
                      onSelectIdea={handleIdeaSelect}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Change Tracking Panel */}
      {pendingChanges.length > 0 && (
        showChangesPanel ? (
          <div className="px-4 pt-2 pb-1 bg-background border-t border-b">
            <div className="flex items-center gap-2 mb-1 justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-semibold">Changes</span>
                <span className="text-xs text-muted-foreground">{pendingChanges.length}</span>
                <span className="flex items-center gap-1">
                  <span className="text-green-600 text-xs">+{pendingChanges.filter(c => c.type === 'add').length}</span>
                  <span className="text-red-600 text-xs">-{pendingChanges.filter(c => c.type === 'remove').length}</span>
                </span>
              </div>
              <div
                className="flex-1 flex justify-end items-center cursor-pointer select-none px-2 py-1 hover:bg-muted/50 rounded transition-colors"
                onClick={() => setShowChangesPanel(false)}
                aria-label="Hide changes panel"
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowChangesPanel(false); }}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <ul className="space-y-1">
              {pendingChanges.map((change) => (
                <li key={change.id} className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-xs">
                  <span>
                    {change.type === 'add' && <span className="text-green-600 font-bold mr-1">+ </span>}
                    {change.type === 'edit' && <span className="text-yellow-600 font-bold mr-1">~ </span>}
                    {change.type === 'remove' && <span className="text-red-600 font-bold mr-1">- </span>}
                    {change.description}
                  </span>
                  <span className="flex gap-1">
                    <Button size="xs" variant="outline" className="px-2 py-0.5 h-6" onClick={() => handleAcceptChange(change.id)}>
                      Accept
                    </Button>
                    <Button size="xs" variant="ghost" className="px-2 py-0.5 h-6" onClick={() => handleRejectChange(change.id)}>
                      Reject
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="px-4 py-1 bg-background border-t border-b flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-semibold">Changes</span>
              <span className="text-xs text-muted-foreground">{pendingChanges.length}</span>
              <span className="flex items-center gap-1">
                <span className="text-green-600 text-xs">+{pendingChanges.filter(c => c.type === 'add').length}</span>
                <span className="text-red-600 text-xs">-{pendingChanges.filter(c => c.type === 'remove').length}</span>
              </span>
            </div>
            <div
              className="flex-1 flex justify-end items-center cursor-pointer select-none px-2 py-1 hover:bg-muted/50 rounded transition-colors"
              onClick={() => setShowChangesPanel(true)}
              aria-label="Show changes panel"
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowChangesPanel(true); }}
            >
              <ChevronUp className="w-4 h-4" />
            </div>
          </div>
        )
      )}

      {/* Add Context Section */}
      {contextItems.length > 0 && (
        <div className="px-4 pt-2 pb-1 bg-background border-t border-b flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground mr-2">Add context</span>
          {contextItems.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs font-medium border border-muted-foreground/20 shadow-sm"
            >
              {item.icon}
              {item.name}
              <button
                className="ml-1 p-0.5 hover:bg-muted-foreground/10 rounded-full"
                onClick={() => handleRemoveContext(item.id)}
                aria-label="Remove context"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Chat Input Area (now a textarea) */}
      <div className="p-4 border-t">
        <div className="relative">
          <textarea
            ref={inputRef as any}
            value={input}
            onChange={handleInputChange as any}
            onKeyDown={handleKeyDown as any}
            placeholder="Plan, search, build anything"
            rows={3}
            className="resize-none w-full rounded-lg border bg-background pr-12 pl-3 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[56px] max-h-40"
            style={{ lineHeight: 1.5 }}
          />
          <div className="absolute right-2 bottom-2">
            <Button
              size="sm"
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              Send
            </Button>
          </div>

          {showMentions && (
            <div
              className="absolute left-0 bottom-full mb-2 w-[340px] z-50 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-xl text-white animate-fade-in"
              style={{ minWidth: inputRef.current?.offsetWidth || 340 }}
            >
              <Command>
                <CommandInput
                  placeholder={`Search ${mentionType === "@" ? "items" : "tags"}...`}
                  value={mentionQuery}
                  onValueChange={setMentionQuery}
                  className="bg-neutral-800 text-white border-none focus:ring-0 focus:outline-none"
                />
                <CommandList className="max-h-64 overflow-y-auto">
                  <CommandEmpty className="text-neutral-400">No results found.</CommandEmpty>
                  <CommandGroup>
                    {filteredMentions.map((item, idx) => (
                      <CommandItem
                        key={item.id}
                        onSelect={() => handleMentionSelect(item)}
                        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        {item.icon}
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-neutral-400">{item.description}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 