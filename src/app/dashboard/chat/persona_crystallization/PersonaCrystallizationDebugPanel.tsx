import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { usePersonaCrystallizationData } from './PersonaCrystallizationContext';
import { InsightsSection } from './InsightsSection';
import { TracesSection } from './TracesSection';
import { DamStatusSection } from './DamStatusSection';
import { AdvancedOptionsSection } from './AdvancedOptionsSection';

/**
 * Persona Crystallization Panel
 * Shows detailed persona traces and insights for all users
 */
export function PersonaCrystallizationDebugPanel() {
  const data = usePersonaCrystallizationData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>('');

  // Import the markdown converter
  const [markdownConverter, setMarkdownConverter] = useState<any>(null);
  
  useEffect(() => {
    import('@/lib/persona-markdown-converter').then(module => {
      setMarkdownConverter(module);
    });
  }, []);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCopy = async (content: string, type: string) => {
    if (!markdownConverter) return;
    
    try {
      const success = await markdownConverter.copyToClipboard(content);
      if (success) {
        setCopyStatus(`${type} copied!`);
        setTimeout(() => setCopyStatus(''), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const generateTracesMarkdown = () => {
    if (!markdownConverter || !data.recentTraces.length) return '';
    return markdownConverter.convertTracesToMarkdown(data.recentTraces, {
      showConfidence: true,
      showMetadata: showAdvanced,
      compactMode: !showAdvanced
    });
  };

  const generateInsightsMarkdown = () => {
    if (!markdownConverter || !data.crystallizedInsights.length) return '';
    return markdownConverter.convertInsightsToMarkdown(data.crystallizedInsights, {
      showConfidence: true,
      showMetadata: showAdvanced,
      compactMode: !showAdvanced
    });
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      whileTap={{ scale: 0.95, cursor: "grabbing" }}
      className="fixed top-4 right-4 z-50 cursor-grab"
    >
      <motion.div
        animate={{
          width: isExpanded ? "560px" : "48px", // Increased from 400px to 560px (40% larger)
          height: isExpanded ? "auto" : "48px",
          maxHeight: isExpanded ? "85vh" : "48px" // Increased from 75vh to 85vh
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-xl"
      >
        {!isExpanded ? (
          <div 
            className="p-2 flex items-center justify-center cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <Info className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
        ) : (
          <div className="max-h-[85vh] overflow-y-auto">
            {/* Enhanced Header */}
            <div 
              className="sticky top-0 bg-background/95 border-b border-border/30 px-6 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-foreground font-semibold text-lg tracking-tight">Persona Intelligence Dashboard</div>
                <div className="flex items-center gap-3">
                  {copyStatus && (
                    <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">{copyStatus}</span>
                  )}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 hover:bg-muted/40 rounded-lg transition-colors cursor-pointer"
                    title="Close panel"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
              </div>
                
                {/* Enhanced Summary Stats */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-foreground">{data.totalTraces.toLocaleString()}</div>
                    <div className="text-muted-foreground text-xs">Total Traces</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-foreground">{data.totalInsights.toLocaleString()}</div>
                    <div className="text-muted-foreground text-xs">Insights</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-foreground">{Math.round(data.profileCompleteness * 100)}%</div>
                    <div className="text-muted-foreground text-xs">Complete</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-foreground">{Math.round(data.overallConfidence * 100)}%</div>
                    <div className="text-muted-foreground text-xs">Confidence</div>
                  </div>
                </div>
                
                {/* Processing Status Banner */}
                {data.isProcessing && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-yellow-800 font-medium text-sm">
                      Processing persona data... ({data.debugInfo?.processingStatus})
                    </span>
                  </div>
                )}
              </div>

              {/* Enhanced Content */}
              <div 
                className="p-6 space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                {data.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 bg-muted/30 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Crystallized Insights Section */}
                    <InsightsSection
                      isExpanded={expandedSections.has('insights')}
                      onToggle={() => toggleSection('insights')}
                      onCopy={() => handleCopy(generateInsightsMarkdown(), 'Insights')}
                      showAdvanced={showAdvanced}
                    />

                    {/* Recent Traces Section */}
                    <TracesSection
                      isExpanded={expandedSections.has('traces')}
                      onToggle={() => toggleSection('traces')}
                      onCopy={() => handleCopy(generateTracesMarkdown(), 'Traces')}
                    />

                    {/* Token Dam Status Section */}
                    {data.damStatus && process.env.NODE_ENV === 'development' && (
                      <DamStatusSection
                        isExpanded={expandedSections.has('dam')}
                        onToggle={() => toggleSection('dam')}
                      />
                    )}

                    {/* Advanced Options */}
                    <AdvancedOptionsSection
                      isExpanded={expandedSections.has('advanced')}
                      onToggle={() => toggleSection('advanced')}
                      showAdvanced={showAdvanced}
                      onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                    />
                  </>
                )}
              </div>
            </div>
        )}
      </motion.div>
    </motion.div>
  );
}
