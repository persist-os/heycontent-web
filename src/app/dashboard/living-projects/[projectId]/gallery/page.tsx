'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { UnifiedGalleryView } from '@/components/gallery';
import { GalleryLoadingSkeleton } from '@/components/gallery/GalleryLoadingSkeleton';
import { useGalleryItems } from '@/hooks/useGalleryItems';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { T } from '@/components/translation/T';

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
  
  // Fetch ALL items (both artifacts and widgets)
  // Supports both projectId and conversationId (like ArtifactPanel pattern)
  const { items, isLoading, effectiveProjectId } = useGalleryItems({
    projectId: projectId || undefined,
    conversationId: conversationId || undefined,
    userId: userId || undefined
  });
  
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
  
  // Loading state
  if (isLoading) {
    return <GalleryLoadingSkeleton />;
  }
  
  // Navigate back to project or conversation
  const handleClose = () => {
    if (projectId) {
      router.push(`/dashboard/living-projects/${projectId}`);
    } else if (conversationId) {
      router.push(`/dashboard/thinking_lab?conversationId=${conversationId}`);
    } else {
      router.push('/dashboard');
    }
  };
  
  // Use effectiveProjectId from hook (handles conversationId -> projectId resolution)
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

