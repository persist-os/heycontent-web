"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Topic {
  id: string;
  name: string;
  description: string;
}

const popularTopics: Topic[] = [
  {
    id: "tech",
    name: "Technology",
    description: "Tech reviews, tutorials, and news"
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    description: "Daily life, habits, and wellness"
  },
  {
    id: "education",
    name: "Education",
    description: "Learning, courses, and knowledge sharing"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Gaming, movies, and pop culture"
  },
  {
    id: "business",
    name: "Business",
    description: "Entrepreneurship, marketing, and finance"
  },
  {
    id: "creative",
    name: "Creative Arts",
    description: "Art, music, and creative expression"
  }
];

interface BrainstormSuggestionsProps {
  onTopicSelect: (topic: string) => void;
  onCustomTopic: (topic: string) => void;
}

export function BrainstormSuggestions({
  onTopicSelect,
  onCustomTopic
}: BrainstormSuggestionsProps) {
  const [customTopic, setCustomTopic] = useState("");

  return (
    <div className="space-y-4 p-2">
      <div className="grid grid-cols-2 gap-2">
        {popularTopics.map((topic) => (
          <Button
            key={topic.id}
            variant="outline"
            className="h-auto p-3 flex flex-col items-start text-left gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => onTopicSelect(topic.name)}
          >
            <p className="font-medium">{topic.name}</p>
            <p className="text-xs text-gray-500">{topic.description}</p>
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="Or enter your own topic..."
          className="flex-1"
        />
        <Button
          onClick={() => {
            if (customTopic.trim()) {
              onCustomTopic(customTopic.trim());
              setCustomTopic("");
            }
          }}
          disabled={!customTopic.trim()}
        >
          Submit
        </Button>
      </div>
    </div>
  );
} 