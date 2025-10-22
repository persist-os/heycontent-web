import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { StarCard } from './StarCard';
import { T } from '@/components/translation';

interface StarsViewProps {
  userId?: string;
}

export const StarsView: React.FC<StarsViewProps> = ({ userId }) => {
  const router = useRouter();

  // Fetch all projects (stars) for the user
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId, limit: 100 } : 'skip'
  );

  if (!userId) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            <T context="stars.login_required">Please log in to view your stars</T>
          </p>
        </div>
      </div>
    );
  }

  if (projects === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/10 rounded-2xl p-6 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sortedProjects = projects ? [...projects].sort((a, b) => b.updatedAt - a.updatedAt) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-foreground"><T context="stars.heading">Stars</T></h2>
        <p className="text-sm text-muted-foreground font-light">
          {sortedProjects.length} <T context={`stars.count.star${sortedProjects.length === 1 ? '' : 's'}`}>{sortedProjects.length === 1 ? 'star' : 'stars'}</T> • {sortedProjects.filter(p => p.hasFingerprintId).length} <T context="stars.metadata.intelligent">intelligent</T> • {sortedProjects.reduce((sum, p) => sum + p.totalContent, 0)} <T context="stars.metadata.total_content">total content</T>
        </p>
      </div>

      {/* Projects Grid */}
      {sortedProjects.length === 0 ? (
        <div className="border border-border/50 rounded-xl p-12 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            <T context="stars.empty.title">No Stars Yet</T>
          </h3>
          <p className="text-muted-foreground font-light mb-6">
            <T context="stars.empty.description">Create your first project to birth a star</T>
          </p>
          <button
            onClick={() => router.push('/dashboard/living-projects')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <T context="stars.empty.action">Create First Star →</T>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedProjects.map((project) => (
            <StarCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

