"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Mic, Edit } from "lucide-react";

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  format: "video" | "short" | "series";
  platforms: string[];
}

interface ContentIdeasProps {
  ideas: ContentIdea[];
  onSelectIdea: (idea: ContentIdea) => void;
}

export function ContentIdeas({ ideas, onSelectIdea }: ContentIdeasProps) {
  return (
    <div className="space-y-4 p-2">
      {ideas.map((idea) => (
        <Card key={idea.id} className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              {idea.format === "video" ? (
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : idea.format === "short" ? (
                <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{idea.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{idea.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {idea.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectIdea(idea)}
            >
              Use This Idea
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 