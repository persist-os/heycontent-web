'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UnifiedGalleryView } from '@/components/gallery';
import { GalleryLoadingSkeleton } from '@/components/gallery/GalleryLoadingSkeleton';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { T } from '@/components/translation/T';
import { ArrowLeft, Lock } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { GalleryItem } from '@/types/gallery';

function GalleryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  
  const projectId = params.projectId as string;
  const initialItemId = searchParams.get('id') as string;
  const conversationId = searchParams.get('conversationId') as string | null;
  
  // Get current user
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getCurrentUserId();
      setUserId(id);
    };
    fetchUserId();
  }, []);
  
  // ✅ PRIMARY PATTERN: Component calls useQuery directly (not through hook)
  // Step 1: If conversationId provided, fetch conversation to get projectId
  const conversation = useQuery(
    api.chatQueries.getConversation,
    conversationId && userId && typeof userId === 'string' && userId.trim().length > 0
      ? { conversationId: conversationId as Id<"conversations">, userId: userId.trim() }
      : "skip"
  );

  // Step 2: Determine effective projectId (from conversation or direct prop)
  const effectiveProjectId = conversation?.projectId || projectId;
  
  // ✅ CRITICAL: Check project access FIRST before calling any queries that might throw
  const projectAccess = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    effectiveProjectId && userId && typeof userId === 'string' && userId.trim().length > 0 ? {
      userId: userId.trim(),
      contentType: 'project',
      contentId: effectiveProjectId
    } : 'skip'
  );
  
  // Determine if user has access (only call artifact/widget queries if access is granted)
  const hasAccess = useMemo(() => {
    if (!userId || !effectiveProjectId) return false;
    if (projectAccess === undefined) return undefined; // Still checking
    if (projectAccess === null) return false; // Access denied
    return true; // Has access (owner, editor, or viewer)
  }, [userId, effectiveProjectId, projectAccess]);
  
  // Step 3: Fetch artifacts using effective projectId (ONLY if access is granted)
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    effectiveProjectId && userId && typeof userId === 'string' && userId.trim().length > 0 && hasAccess === true ? { 
      projectId: effectiveProjectId as Id<'projects'>,
      userId: userId.trim()
    } : 'skip'
  );
  
  // Step 4: Fetch widgets using effective projectId (ONLY if access is granted)
  const widgets = useQuery(
    api.widgetsQueries.getProjectWidgets,
    effectiveProjectId && userId && typeof userId === 'string' && userId.trim().length > 0 && hasAccess === true ? { 
      projectId: effectiveProjectId as Id<'projects'>, 
      userId: userId.trim(),
      includeArchived: true
    } : 'skip'
  );
  
  // Step 5: Merge and normalize into unified list
  const items = useMemo(() => {
    const artifactItems: GalleryItem[] = (artifacts || [])
      .filter((a: any) => a && a._id)
      .map((a: any) => {
        let title = a.title;
        if (!title && a.data?.title) {
          title = a.data.title;
        }
        if (!title && a.type === 'report' && a.data?.markdown) {
          const match = a.data.markdown.match(/^#\s+(.+)$/m);
          if (match) {
            title = match[1].trim();
          }
        }
        if (!title) {
          title = a.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Artifact';
        }
        return {
          ...a,
          itemType: 'artifact' as const,
          title,
          description: a.tags?.join(' • ') || `v${a.metadata?.version || 1}`,
          updatedAt: a.updatedAt || a._creationTime
        };
      });
    
    const widgetItems: GalleryItem[] = (widgets || [])
      .filter((w: any) => w && w._id && w.status !== 'deleted')
      .map((w: any) => ({
        ...w,
        itemType: 'widget' as const,
        title: w.title || 'Untitled Widget',
        description: w.description || 'No description',
        updatedAt: w.updatedAt || w._creationTime
      }));
    
    return [...artifactItems, ...widgetItems].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [artifacts, widgets]);
  
  // Loading state
  const isLoadingConversation = conversationId && userId && conversation === undefined;
  const isLoadingAccess = hasAccess === undefined && userId && effectiveProjectId;
  const isLoadingItems = hasAccess === true && effectiveProjectId && (artifacts === undefined || widgets === undefined);
  const isLoading = isLoadingConversation || isLoadingAccess || isLoadingItems;
  
  // Validate parameters
  if (!initialItemId || (!projectId && !conversationId)) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              <T context="gallery.error.invalid.parameters">Invalid gallery parameters. Please provide an item ID and either a project ID or conversation ID.</T>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // ✅ Error handling: Show access denied message with back button (check BEFORE queries run)
  if (hasAccess === false && !isLoadingAccess) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-card/50 backdrop-blur-sm border border-destructive/50">
          <CardContent className="py-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have permission to view this project. This project may be private or you may need to be added as a collaborator.
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/thinking_lab')}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back to Thinking Lab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return <GalleryLoadingSkeleton />;
  }
  
  // Navigate back to Thinking Lab chat
  const handleClose = () => {
    if (projectId) {
      // Navigate to Thinking Lab with project context
      router.push(`/dashboard/thinking_lab?projectId=${projectId}`);
    } else if (conversationId) {
      router.push(`/dashboard/thinking_lab?conversationId=${conversationId}`);
    } else {
      router.push('/dashboard/thinking_lab');
    }
  };
  
  // Use effectiveProjectId (handles conversationId -> projectId resolution)
  // Fallback to projectId from URL params if available
  const finalProjectId = effectiveProjectId || projectId || '';
  
  if (!finalProjectId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              <T context="gallery.error.no.context">Unable to determine project context. Please try again.</T>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <UnifiedGalleryView
      projectId={finalProjectId}
      initialItemId={initialItemId}
      items={items}
      onClose={handleClose}
      userId={userId || undefined}
    />
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryLoadingSkeleton />}>
      <GalleryContent />
    </Suspense>
  );
}

