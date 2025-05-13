import React from 'react';
import { Brain, MessageSquare, Lightbulb, ExternalLink, Layout, Box, Layers, Zap, GitBranch } from 'lucide-react';
import type { Note } from '../types/index';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NoteReferencesProps {
  references: Note['references'];
  selectedInsight: string | null;
  setSelectedInsight: (insight: string | null) => void;
  setShowFullAnalysis: (show: boolean) => void;
}

export function NoteReferences({ 
  references, 
  selectedInsight, 
  setSelectedInsight, 
  setShowFullAnalysis 
}: NoteReferencesProps) {
  const router = useRouter();
  
  // Add debug log for initial render
  console.log('NoteReferences rendered with references:', references);
  
  if (references.length === 0) {
    console.log('No references to display');
    return null;
  }

  const handleReferenceClick = (ref: Note['references'][0], e: React.MouseEvent) => {
    // Add event debug
    console.log('Click event:', e);
    console.log('Reference clicked:', ref);
    
    // Prevent event bubbling
    e.stopPropagation();
    
    switch (ref.type) {
      case 'screen':
        console.log('Navigating to screen:', ref.content);
        router.push(`/dashboard/${ref.content.toLowerCase().replace(/\s+/g, '-')}`);
        break;
      case 'component':
        console.log('Navigating to component:', ref.content);
        router.push(`/dashboard/components/${ref.content.toLowerCase().replace(/\s+/g, '-')}`);
        break;
      case 'section':
        console.log('Navigating to section:', ref.content);
        router.push(`/dashboard/sections/${ref.content.toLowerCase().replace(/\s+/g, '-')}`);
        break;
      case 'feature':
        console.log('Navigating to feature:', ref.content);
        router.push(`/dashboard/features/${ref.content.toLowerCase().replace(/\s+/g, '-')}`);
        break;
      case 'workflow':
        console.log('Navigating to workflow:', ref.content);
        router.push(`/dashboard/workflows/${ref.content.toLowerCase().replace(/\s+/g, '-')}`);
        break;
      case 'conversation':
        console.log('Navigating to conversation:', ref.content);
        router.push(`/dashboard/conversations/${ref.content}`);
        break;
      case 'ai_insight':
        console.log('Showing AI insight:', ref.content);
        setSelectedInsight(ref.content);
        setShowFullAnalysis(true);
        break;
      case 'url':
        console.log('Opening URL:', ref.content);
        window.open(ref.content, '_blank');
        break;
      default:
        console.log('Reference clicked:', ref);
    }
  };

  const getReferenceStyle = (type: string) => {
    switch (type) {
      case 'ai_insight':
        return 'bg-purple-100';
      case 'conversation':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'idea':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'screen':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'component':
        return 'bg-indigo-50 border-l-4 border-indigo-500';
      case 'section':
        return 'bg-pink-50 border-l-4 border-pink-500';
      case 'feature':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'workflow':
        return 'bg-teal-50 border-l-4 border-teal-500';
      default:
        return 'bg-gray-50';
    }
  };

  const getReferenceIcon = (type: string) => {
    switch (type) {
      case 'ai_insight':
        return <Brain className="w-4 h-4 text-purple-600" />;
      case 'conversation':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'idea':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case 'screen':
        return <Layout className="w-4 h-4 text-green-600" />;
      case 'component':
        return <Box className="w-4 h-4 text-indigo-600" />;
      case 'section':
        return <Layers className="w-4 h-4 text-pink-600" />;
      case 'feature':
        return <Zap className="w-4 h-4 text-orange-600" />;
      case 'workflow':
        return <GitBranch className="w-4 h-4 text-teal-600" />;
      default:
        return <ExternalLink className="w-4 h-4 text-gray-600" />;
    }
  };

  const getReferenceLabel = (type: string) => {
    switch (type) {
      case 'ai_insight':
        return 'AI Insight';
      case 'conversation':
        return 'Conversation';
      case 'idea':
        return 'Idea';
      case 'screen':
        return 'Screen';
      case 'component':
        return 'Component';
      case 'section':
        return 'Section';
      case 'feature':
        return 'Feature';
      case 'workflow':
        return 'Workflow';
      default:
        return 'Reference';
    }
  };

  const getReferenceHref = (ref: Note['references'][0]) => {
    switch (ref.type) {
      case 'screen':
        return `/dashboard/${ref.content.toLowerCase().replace(/\s+/g, '-')}`;
      case 'component':
        return `/dashboard/components/${ref.content.toLowerCase().replace(/\s+/g, '-')}`;
      case 'section':
        return `/dashboard/sections/${ref.content.toLowerCase().replace(/\s+/g, '-')}`;
      case 'feature':
        return `/dashboard/features/${ref.content.toLowerCase().replace(/\s+/g, '-')}`;
      case 'workflow':
        return `/dashboard/workflows/${ref.content.toLowerCase().replace(/\s+/g, '-')}`;
      case 'conversation':
        return `/dashboard/conversations/${ref.content}`;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg bg-purple-50 p-4 space-y-4 mb-6">
      <h3 className="font-medium text-purple-800">Insights & References</h3>
      {references.map((ref, index) => {
        const href = getReferenceHref(ref);
        const isClickable = href || ref.type === 'url' || ref.type === 'ai_insight';
        
        console.log(`Rendering reference ${index}:`, { ref, href, isClickable });
        
        return (
          <div
            key={index}
            className={`p-3 rounded-lg ${getReferenceStyle(ref.type)} ${isClickable ? 'cursor-pointer hover:bg-opacity-90 hover:shadow-md transition-all duration-200' : ''}`}
            onClick={(e) => {
              console.log('Click detected on reference:', ref);
              isClickable && handleReferenceClick(ref, e);
            }}
            onMouseEnter={() => {
              console.log('Mouse entered reference:', ref);
            }}
            onMouseLeave={() => {
              console.log('Mouse left reference:', ref);
            }}
          >
            <div className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700">
              {getReferenceIcon(ref.type)}
              <span 
                className={`${isClickable ? 'hover:text-purple-600 transition-colors' : ''}`}
                onClick={(e) => {
                  console.log('Label clicked:', ref);
                  e.stopPropagation();
                  isClickable && handleReferenceClick(ref, e);
                }}
              >
                {getReferenceLabel(ref.type)}
              </span>
              {ref.isLoading && <span className="ml-2 inline-block animate-pulse text-purple-600">Analyzing...</span>}
            </div>
            {ref.isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-purple-300 animate-pulse"></div>
                <div className="w-4 h-4 rounded-full bg-purple-400 animate-pulse delay-150"></div>
                <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse delay-300"></div>
                <p className="text-gray-500 ml-2">Analyzing your note with SmartNoteGemini...</p>
              </div>
            ) : (
              <div 
                className="text-gray-700 whitespace-pre-line overflow-auto"
                onClick={(e) => {
                  console.log('Content clicked:', ref);
                  e.stopPropagation();
                  isClickable && handleReferenceClick(ref, e);
                }}
              >
                {ref.content && (ref.content.includes('##') || ref.content.includes('```')) ? (
                  <>
                    <div className="markdown-content max-h-[400px] overflow-y-auto mb-2">
                      {ref.content.split('\n').map((line, i, arr) => {
                        if (line.startsWith('```json')) {
                          let codeContent = [];
                          let endIndex = i;
                          for (let j = i + 1; j < arr.length; j++) {
                            if (arr[j] === '```') {
                              endIndex = j;
                              break;
                            }
                            codeContent.push(arr[j]);
                          }
                          for (let j = i + 1; j <= endIndex; j++) {
                            arr[j] = '';
                          }
                          return (
                            <div key={i} className="bg-gray-800 text-white p-3 rounded-md my-2 overflow-x-auto">
                              <pre className="text-sm">{codeContent.join('\n')}</pre>
                            </div>
                          );
                        }
                        if (line === '') return null;
                        if (line.startsWith('## ')) {
                          return <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-purple-800">{line.substring(3)}</h2>;
                        } else if (line.startsWith('### ')) {
                          return <h3 key={i} className="text-lg font-semibold mt-3 mb-2 text-purple-700">{line.substring(4)}</h3>;
                        } else if (line.trim().startsWith('- ')) {
                          const content = line.trim().substring(2);
                          return (
                            <div key={i} className="flex items-start my-1">
                              <span className="mr-2 mt-1 text-purple-500">•</span>
                              <span>{content}</span>
                            </div>
                          );
                        } else if (line.includes('**')) {
                          const parts = line.split(/\*\*(.*?)\*\*/g);
                          return (
                            <p key={i} className="my-1">
                              {parts.map((part: string, partIndex: number) => {
                                return partIndex % 2 === 0 ?
                                  part :
                                  <strong key={partIndex} className="font-semibold">{part}</strong>;
                              })}
                            </p>
                          );
                        } else {
                          return <p key={i} className="my-1">{line}</p>;
                        }
                      }).filter(Boolean)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInsight(ref.content);
                        setShowFullAnalysis(true);
                      }}
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 mt-2"
                    >
                      <ExternalLink size={14} />
                      View Full Analysis
                    </button>
                  </>
                ) : (
                  <div className={`${isClickable ? 'hover:text-purple-600 transition-colors' : ''}`}>
                    {ref.content}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 