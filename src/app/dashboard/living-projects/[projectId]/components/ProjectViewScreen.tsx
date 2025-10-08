/**
 * Project View Screen Component
 * 
 * Main project detail view with constellation display and integrated content section.
 * Integrates ProjectContentSection for displaying all attached content.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/context/auth-context';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  Settings,
  Share2,
  MoreVertical,
  Star,
  MessageCircle,
  FileText,
  Sparkles,
  Gem,
  Activity,
  Users,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ProjectContentSection } from './ProjectContentSection';
import { ProjectFingerprint } from './widgets/ProjectFingerprint';

interface ProjectViewScreenProps {
  projectId: string;
  className?: string;
}

export function ProjectViewScreen({ projectId, className = '' }: ProjectViewScreenProps) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [isContentSectionOpen, setIsContentSectionOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      if (firebaseUser?.uid) {
        setUserId(firebaseUser.uid);
      }
    };
    fetchUserId();
  }, [firebaseUser]);

  // Fetch project data
  const project = useQuery(
    api.projectsQueries.getById,
    userId && projectId ? { 
      projectId: projectId as Id<"projects">, 
      userId 
    } : "skip"
  );

  // Fetch project statistics
  const projectStats = useQuery(
    api.projectsQueries.getStats,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  // Handle navigation back
  const handleBack = () => {
    router.push('/dashboard/living-projects');
  };

  // Handle content section toggle
  const handleContentSectionToggle = () => {
    setIsContentSectionOpen(!isContentSectionOpen);
  };

  // Handle menu actions
  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    switch (action) {
      case 'settings':
        // Navigate to project settings
        console.log('Navigate to project settings');
        break;
      case 'share':
        // Open share modal
        console.log('Open share modal');
        break;
      case 'export':
        // Export project data
        console.log('Export project data');
        break;
      case 'archive':
        // Archive project
        console.log('Archive project');
        break;
    }
  };

  // Loading state
  if (!project || !userId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/20 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-muted/20 rounded mb-8"></div>
            <div className="h-32 bg-muted/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Back to projects"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-muted-foreground text-lg">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Content Section Toggle */}
              <button
                onClick={handleContentSectionToggle}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors flex items-center gap-2",
                  isContentSectionOpen 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <FileText className="w-4 h-4" />
                Content
                {projectStats && (
                  <span className="ml-1 text-xs bg-background/20 px-2 py-0.5 rounded-full">
                    {projectStats.stats.total}
                  </span>
                )}
              </button>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  aria-label="Project menu"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-10 bg-background border border-border rounded-lg shadow-lg py-1 z-10 min-w-[160px]"
                  >
                    <button
                      onClick={() => handleMenuAction('settings')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => handleMenuAction('share')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      onClick={() => handleMenuAction('export')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => handleMenuAction('archive')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 text-red-600"
                    >
                      <Star className="w-4 h-4" />
                      Archive
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Project Stats */}
        {projectStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {projectStats.stats.notes}
                  </div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {projectStats.stats.conversations}
                  </div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                  <Gem className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {projectStats.stats.crystals}
                  </div>
                  <div className="text-sm text-muted-foreground">Crystals</div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {projectStats.stats.shards}
                  </div>
                  <div className="text-sm text-muted-foreground">Shards</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Project Intelligence (Fingerprint) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <ProjectFingerprint 
            projectId={projectId as Id<"projects">} 
            className="w-full"
          />
        </motion.div>

        {/* Project Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ProjectContentSection
            projectId={projectId}
            userId={userId}
            isOpen={isContentSectionOpen}
            onToggle={handleContentSectionToggle}
          />
        </motion.div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
