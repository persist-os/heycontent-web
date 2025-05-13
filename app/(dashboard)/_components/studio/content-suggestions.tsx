"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Edit, Image, Sparkles, Upload } from "lucide-react";

interface ContentSuggestionsProps {
  onSelect: (type: "recording" | "editing" | "thumbnail" | "brainstorm" | "upload") => void;
}

export function ContentSuggestions({ onSelect }: ContentSuggestionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => onSelect("recording")}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium">Start Recording</h3>
            <p className="text-sm text-gray-500">Record new content with AI assistance</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => onSelect("upload")}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
            <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-medium">Upload Media</h3>
            <p className="text-sm text-gray-500">Edit existing photos or videos</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => onSelect("editing")}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
            <Edit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium">Edit Content</h3>
            <p className="text-sm text-gray-500">Trim, enhance, and add effects</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => onSelect("thumbnail")}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Image className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-medium">Create Thumbnail</h3>
            <p className="text-sm text-gray-500">Design eye-catching thumbnails</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors col-span-2" onClick={() => onSelect("brainstorm")}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/20">
            <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h3 className="font-medium">Need Ideas?</h3>
            <p className="text-sm text-gray-500">Get AI-powered content suggestions</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 