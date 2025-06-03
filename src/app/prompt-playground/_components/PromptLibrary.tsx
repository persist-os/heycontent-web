import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Zap, ChevronRight, Sparkles, Brain, Target, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Prompt {
  id: string;
  title: string;
  description: string;
  instructions: string;
  platform: string;
  goal: string;
  rating?: number;
  agentType?: string;
}

interface PromptLibraryProps {
  groupedPrompts: Record<string, Prompt[]>;
  onSelect: (prompt: Prompt) => void;
  onTest: (prompt: Prompt) => void;
  selectedPromptId: string | null;
  onNewPrompt: () => void;
}

export function PromptLibrary({
  groupedPrompts,
  onSelect,
  onTest,
  selectedPromptId,
  onNewPrompt
}: PromptLibraryProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const agentTypes = Object.keys(groupedPrompts);
  const totalPrompts = Object.values(groupedPrompts).flat().length;

  const toggleSection = (agentType: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [agentType]: !prev[agentType]
    }));
  };

  const formatAgentTypeName = (agentType: string) => {
    return agentType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getAgentTypeIcon = (agentType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'content_creator': <Sparkles className="w-5 h-5" />,
      'social_media': <Target className="w-5 h-5" />,
      'email_marketing': <Brain className="w-5 h-5" />,
      'default': <Brain className="w-5 h-5" />
    };
    return iconMap[agentType] || iconMap.default;
  };

  const getAgentTypeColor = (agentType: string) => {
    const colorMap: Record<string, string> = {
      'content_creator': 'from-purple-500 to-pink-500',
      'social_media': 'from-blue-500 to-cyan-500',
      'email_marketing': 'from-green-500 to-emerald-500',
      'default': 'from-gray-500 to-slate-500'
    };
    return colorMap[agentType] || colorMap.default;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Prompt Library</h1>
            <p className="text-sm text-gray-600">
              {totalPrompts} prompt{totalPrompts !== 1 ? 's' : ''} across {agentTypes.length} agent type{agentTypes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={onNewPrompt}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {agentTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No prompts found</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first prompt</p>
            <Button onClick={onNewPrompt} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create First Prompt
            </Button>
          </div>
        ) : (
          agentTypes.map(agentType => {
            const isExpanded = expandedSections[agentType] === true; // Default to collapsed
            const prompts = groupedPrompts[agentType];
            const firstPrompt = prompts[0];

            return (
              <div key={agentType} className="group">
                {/* Agent Type Header */}
                <div 
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white/80 hover:border-gray-300/60 transition-all duration-300 cursor-pointer mb-4 group"
                  onClick={() => toggleSection(agentType)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md bg-gradient-to-r ${getAgentTypeColor(agentType)} text-white shadow-sm`}>
                      {getAgentTypeIcon(agentType)}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                      {formatAgentTypeName(agentType)}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTest(prompts[0]);
                      }}
                      size="sm"
                      className="bg-black hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 px-3 py-1.5 text-xs font-medium"
                    >
                      <Zap className="w-3 h-3 mr-1.5" />
                      Test
                    </Button>
                    <ChevronRight 
                      className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 ${
                        isExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* Agent Type Description */}
                {isExpanded && firstPrompt && (
                  <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Description
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {firstPrompt.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Instructions
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {firstPrompt.instructions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 