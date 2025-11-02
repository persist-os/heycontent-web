'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { UnifiedGalleryView } from '@/components/gallery';
import { useGalleryItems } from '@/hooks/useGalleryItems';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function GalleryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const projectId = params.projectId as string;
  const initialItemId = searchParams.get('id') as string;
  
  // Fetch ALL items (both artifacts and widgets)
  const { items, isLoading } = useGalleryItems(projectId || '');
  
  // Validate parameters
  if (!initialItemId || !projectId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Invalid gallery parameters. Please provide an item ID.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md">
        <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
          <CardContent className="py-8 px-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading gallery...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Navigate back to project
  const handleClose = () => {
    router.push(`/dashboard/living-projects/${projectId}`);
  };
  
  return (
    <UnifiedGalleryView
      projectId={projectId}
      initialItemId={initialItemId}
      items={items}
      onClose={handleClose}
    />
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md">
        <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
          <CardContent className="py-8 px-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading gallery...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
}

