/**
 * Project Content Section Component
 * 
 * Collapsible section displaying all content attached to a project.
 * Provides tabbed filtering and unified content display for the Project Content Display feature.
 * Includes comprehensive accessibility features and smooth animations.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { ContentCard, ContentCardData } from '@/components/command-palette';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  MessageCircle, 
  Gem, 
  Sparkles,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentTypeTabs } from './ContentTypeTabs';
import { ProjectContentItem, ContentTypeFilter } from '@/convex/projectContentQueries';
import { T } from '@/components/translation/T';

interface ProjectContentSectionProps {
  projectId: string;
  userId: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ProjectContentSection({
  projectId,
  userId,
  isOpen,
  onToggle,
  className = ''
}: ProjectContentSectionProps) {
  const [activeTab, setActiveTab] = useState<ContentTypeFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Fetch content data with pagination support
  const contentData = useQuery(api.projectContentQueries.getProjectContent, {
    projectId: projectId as Id<"projects">,
    userId,
    contentType: activeTab,
    limit: 50,
    offset: 0
  });

  // Fetch content counts for tabs
  const contentCounts = useQuery(api.projectContentQueries.getProjectContentCounts, {
    projectId: projectId as Id<"projects">,
    userId
  });

  // Search functionality
  const searchResults = useQuery(
    api.projectContentQueries.searchProjectContent,
    searchTerm.trim() ? {
      projectId: projectId as Id<"projects">,
      userId,
      searchTerm: searchTerm.trim(),
      contentType: activeTab,
      limit: 50
    } : "skip"
  );

  // Determine which data to display
  const displayData = searchTerm.trim() ? searchResults || [] : contentData?.items || [];
  const isLoading = searchTerm.trim() ? searchResults === undefined : contentData === undefined;
  const totalCount = searchTerm.trim() ? searchResults?.length || 0 : contentData?.totalCount || 0;
  const hasMore = contentData?.hasMore || false;

  // Reset search when tab changes
  useEffect(() => {
    setSearchTerm("");
    setIsSearchVisible(false);
  }, [activeTab]);

  // Convert ProjectContentItem to ContentCardData
  const convertToCardData = (item: ProjectContentItem): ContentCardData => {
    return {
      id: item.id,
      type: item.type as any,
      title: item.title,
      content: item.preview,
      metadata: item.metadata
    }
  }

  // Handle card click
  const handleCardClick = (content: ContentCardData) => {
    console.log(`Opening ${content.type} with ID: ${content.id}`)
  }

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'conversation':
        return <MessageCircle className="w-4 h-4" />;
      case 'crystal':
        return <Gem className="w-4 h-4" />;
      case 'shard':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Render empty state
  const renderEmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          {getContentTypeIcon(activeTab === 'all' ? 'note' : activeTab.slice(0, -1))}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          <T context="project.content.empty.title">No Content Found</T>
        </h3>
        <p className="text-muted-foreground max-w-sm">
          {searchTerm.trim() ? (
            <>
              <T context="project.content.empty.search">No content found matching</T> "{searchTerm}"
            </>
          ) : (
            <>
              {activeTab === 'notes' && (
                <T context="project.content.empty.notes">No notes attached to this project</T>
              )}
              {activeTab === 'conversations' && (
                <T context="project.content.empty.conversations">No conversations attached to this project</T>
              )}
              {activeTab === 'crystals' && (
                <T context="project.content.empty.crystals">No crystals attached to this project</T>
              )}
              {activeTab === 'shards' && (
                <T context="project.content.empty.shards">No crystal shards attached to this project</T>
              )}
              {activeTab === 'all' && (
                <T context="project.content.empty.all">No content attached to this project</T>
              )}
            </>
          )}
        </p>
        {!searchTerm.trim() && (
          <p className="text-sm text-muted-foreground mt-2">
            <T context="project.content.empty.description">
            Content will appear here when you attach notes, conversations, or generate crystals for this project.
            </T>
          </p>
        )}
      </div>
    );
  };

  // Render loading state
  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-muted/20 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-muted/40 rounded mb-3"></div>
          <div className="h-3 bg-muted/30 rounded mb-2"></div>
          <div className="h-3 bg-muted/30 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  // Render content grid with accessibility
  const renderContentGrid = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    if (!displayData || displayData.length === 0) {
      return renderEmptyState();
    }

    return (
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6"
        aria-label={`Project content: ${displayData.length} items`}
      >
        <AnimatePresence>
          {displayData.map((content: ProjectContentItem, index: number) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <ContentCard
                content={convertToCardData(content)}
                onClick={handleCardClick}
                showMetadata={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Load more indicator */}
        {hasMore && (
          <div className="col-span-full flex justify-center py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                <T context="project.content.loading.more">Loading more content...</T>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("border-t border-border/20", className)}>
      {/* Collapsible Header with enhanced accessibility */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-background hover:bg-muted/20 transition-colors group focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2"
        aria-expanded={isOpen ? "true" : "false"}
        aria-controls="project-content-section"
        aria-describedby="project-content-description"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <div className="font-medium text-foreground">
              <T context="project.content.section.title">Project Content</T>
            </div>
            <div id="project-content-description" className="text-sm text-muted-foreground">
              {contentCounts ? (
                <>
                  {contentCounts.all} <T context="project.content.items">items</T>
                </>
              ) : (
                <T context="status.loading">Loading...</T>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchVisible(!isSearchVisible);
            }}
            className="p-2 rounded-lg hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-label={`${isSearchVisible ? 'Hide' : 'Show'} search`}
            aria-expanded={isSearchVisible ? "true" : "false"}
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {/* Collapse Toggle */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="project-content-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
            role="region"
            aria-label="Project content details"
          >
            <div className="border-t border-border/10 bg-muted/5">
              {/* Search Bar with accessibility */}
              <AnimatePresence>
                {isSearchVisible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-border/10"
                    role="search"
                    aria-label="Search project content"
                  >
                    <div className="p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search content..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                          aria-label="Search content"
                          aria-describedby="search-help"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded focus:outline-none focus:ring-2 focus:ring-accent/20"
                            aria-label="Clear search"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div id="search-help" className="text-xs text-muted-foreground mt-1">
                        Search through titles, content, and metadata
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content Type Tabs */}
              {contentCounts && (
                <ContentTypeTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  contentCounts={contentCounts}
                />
              )}

              {/* Content Grid */}
              {renderContentGrid()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}