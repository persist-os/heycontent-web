"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, Filter, Image, Video, File, Grid, List, Plus, FolderOpen, Download, Upload, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MediaItem {
  id: string;
  type: "image" | "video" | "document";
  name: string;
  thumbnail: string;
  size: string;
  date: string;
}

interface Template {
  id: string;
  name: string;
  type: "thumbnail" | "video" | "document";
  thumbnail: string;
  description: string;
  date: string;
}

interface MediaLibraryProps {
  onSelectMedia: (media: MediaItem) => void;
  onSelectTemplate: (template: Template) => void;
}

export function MediaLibrary({ onSelectMedia, onSelectTemplate }: MediaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video" | "document">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"media" | "templates">("media");
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Mock data - Replace with actual media items from your backend
  const mediaItems: MediaItem[] = [
    {
      id: "1",
      type: "image",
      name: "thumbnail-1.jpg",
      thumbnail: "/mock-thumbnail-1.jpg",
      size: "2.4 MB",
      date: "2024-03-20"
    },
    {
      id: "2",
      type: "video",
      name: "intro-video.mp4",
      thumbnail: "/mock-thumbnail-2.jpg",
      size: "45.8 MB",
      date: "2024-03-19"
    },
    {
      id: "3",
      type: "document",
      name: "script.docx",
      thumbnail: "/mock-thumbnail-3.jpg",
      size: "1.2 MB",
      date: "2024-03-18"
    }
  ];

  // Mock templates data
  const templates: Template[] = [
    {
      id: "1",
      name: "YouTube Thumbnail Template",
      type: "thumbnail",
      thumbnail: "/mock-template-1.jpg",
      description: "16:9 ratio template for YouTube videos",
      date: "2024-03-20"
    },
    {
      id: "2",
      name: "Video Intro Template",
      type: "video",
      thumbnail: "/mock-template-2.jpg",
      description: "5-second animated intro sequence",
      date: "2024-03-19"
    }
  ];

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const filteredTemplates = templates.filter(template => {
    return template.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "document":
        return <File className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleAddTemplate = () => {
    // TODO: Implement template upload
    console.log("Add template clicked");
  };

  const handleImportTemplate = async () => {
    if (!importUrl) return;
    
    setIsImporting(true);
    try {
      // TODO: Implement actual template import from URL
      console.log("Importing template from URL:", importUrl);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add the imported template to the list
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: `Imported Template ${templates.length + 1}`,
        type: "thumbnail",
        thumbnail: "/mock-template-1.jpg",
        description: `Imported from ${importUrl}`,
        date: new Date().toISOString().split('T')[0]
      };
      
      templates.push(newTemplate);
      setImportUrl("");
    } catch (error) {
      console.error("Failed to import template:", error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Media Library</h2>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "media" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("media")}
          >
            Media
          </Button>
          <Button
            variant={activeTab === "templates" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("templates")}
          >
            Templates
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={activeTab === "media" ? "Search media..." : "Search templates..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {activeTab === "media" && (
            <div className="flex gap-2">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
              >
                All
              </Button>
              <Button
                variant={selectedType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("image")}
              >
                <Image className="w-4 h-4 mr-1" />
                Images
              </Button>
              <Button
                variant={selectedType === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("video")}
              >
                <Video className="w-4 h-4 mr-1" />
                Videos
              </Button>
              <Button
                variant={selectedType === "document" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("document")}
              >
                <File className="w-4 h-4 mr-1" />
                Documents
              </Button>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTemplate}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Template
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Link className="w-4 h-4 mr-1" />
                    Import from URL
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Template from URL</DialogTitle>
                    <DialogDescription>
                      Enter the URL of the template you want to import. This can be a direct link to a template file or a template sharing platform.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="https://example.com/template"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                      />
                      <p className="text-sm text-gray-500">
                        Supported formats: .template, .json, .zip
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setImportUrl("")}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImportTemplate}
                        disabled={!importUrl || isImporting}
                      >
                        {isImporting ? "Importing..." : "Import"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Media Grid/List */}
      <ScrollArea className="flex-1 p-4">
        {activeTab === "media" ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
                  onClick={() => onSelectMedia(item)}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="text-white">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-300">
                        {item.size} • {item.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => onSelectMedia(item)}
                >
                  <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.size} • {item.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
                onClick={() => onSelectTemplate(template)}
              >
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="text-white">
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-gray-300 mt-1">{template.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm" variant="secondary">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="secondary">
                        <FolderOpen className="w-4 h-4 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 