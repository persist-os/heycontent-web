import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const InsightsTab = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [activeView, setActiveView] = useState<'overview' | 'crystals' | 'shards'>('overview');

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      auth = null;
    }
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid);
    });
    return () => unsubscribe();
  }, []);

  // Fetch data using the crystal queries
  const crystalStats = useQuery(
    api.crystalQueries.getCrystalStats,
    userId ? { userId } : "skip"
  );

  const recentCrystals = useQuery(
    api.crystalQueries.getPersonaData,
    userId ? { userId, operation: "crystals", limit: 5 } : "skip"
  );

  const recentShards = useQuery(
    api.crystalQueries.getPersonaData,
    userId ? { userId, operation: "shards", limit: 8 } : "skip"
  );

  if (!userId) {
    return <InsightsSkeleton />;
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground">Your Knowledge</h3>
          <p className="text-muted-foreground">Patterns and insights discovered from your interactions</p>
        </div>

        {crystalStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl font-light tracking-tight text-foreground">
                {crystalStats.crystalsCount}
              </div>
              <div className="text-sm text-muted-foreground">Knowledge Crystals</div>
              <div className="text-xs text-muted-foreground">
                Consolidated patterns and insights
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light tracking-tight text-foreground">
                {crystalStats.shardsCount}
              </div>
              <div className="text-sm text-muted-foreground">Information Shards</div>
              <div className="text-xs text-muted-foreground">
                Raw insights and observations
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-light tracking-tight text-foreground">
                {crystalStats.recentActivity.crystalsThisWeek + crystalStats.recentActivity.shardsThisWeek}
              </div>
              <div className="text-sm text-muted-foreground">This Week</div>
              <div className="text-xs text-muted-foreground">
                New discoveries made
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confidence Distribution */}
      {crystalStats && Object.keys(crystalStats.byConfidence).length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">Confidence Levels</h4>
              <p className="text-sm text-muted-foreground">How certain we are about these patterns</p>
            </div>
            
            <div className="space-y-3">
              {Object.entries(crystalStats.byConfidence).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      level === 'high' ? 'bg-blue-400' : 
                      level === 'medium' ? 'bg-amber-400' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-foreground capitalize">{level}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Recent Activity */}
      {recentCrystals && recentCrystals.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">Recent Crystals</h4>
                <p className="text-sm text-muted-foreground">Latest consolidated insights</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setActiveView('crystals')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              {(recentCrystals as any[]).slice(0, 3).map((crystal: any, index: number) => (
                <div key={crystal._id} className="space-y-2 py-3 border-l-2 border-blue-400/30 pl-4">
                  <div className="font-medium text-foreground">{crystal.name}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {crystal.description}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-muted/30 rounded">
                      {crystal.dimension}
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      crystal.confidence_score === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
                      crystal.confidence_score === 'moderate' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {crystal.confidence_score} confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderCrystals = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Knowledge Crystals</h3>
        <p className="text-muted-foreground">Consolidated patterns and behavioral insights</p>
      </div>

      {recentCrystals ? (
        <div className="space-y-6">
          {(recentCrystals as any[]).map((crystal: any) => (
            <div key={crystal._id} className="border border-border/50 rounded-2xl p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-medium text-foreground">{crystal.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-muted/30 rounded">
                      {crystal.dimension}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      crystal.confidence_score === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
                      crystal.confidence_score === 'moderate' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {crystal.confidence_score}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">{crystal.description}</p>
              </div>

              {crystal.core_insight && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">Key Insight</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">{crystal.core_insight}</p>
                </div>
              )}

              {crystal.behavioral_implications && crystal.behavioral_implications.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">Behavioral Implications</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {crystal.behavioral_implications.map((implication: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/60 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{implication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {crystal.supporting_quotes && crystal.supporting_quotes.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">Supporting Evidence</h5>
                  <div className="space-y-2">
                    {crystal.supporting_quotes.slice(0, 2).map((quote: string, index: number) => (
                      <blockquote key={index} className="text-sm text-muted-foreground italic border-l-2 border-border/50 pl-3 leading-relaxed">
                        "{quote}"
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>
                  {crystal.observation_count} observations • {crystal.time_span_days} days
                </span>
                <span>{crystal.crystal_type?.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border/50 rounded-2xl p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderShards = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Information Shards</h3>
        <p className="text-muted-foreground">Raw insights and observations</p>
      </div>

      {recentShards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(recentShards as any[]).map((shard: any) => (
            <div key={shard._id} className="border border-border/50 rounded-xl p-4 space-y-3">
              {shard.exact_quote && (
                <blockquote className="text-sm text-foreground italic border-l-2 border-blue-400/60 pl-3 leading-relaxed">
                  "{shard.exact_quote}"
                </blockquote>
              )}

              <div className="space-y-2">
                {shard.what_it_reveals && (
                  <div className="space-y-1">
                    <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Reveals</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">{shard.what_it_reveals}</p>
                  </div>
                )}

                {shard.why_significant && (
                  <div className="space-y-1">
                    <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Significance</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">{shard.why_significant}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-muted/30 rounded">
                    {shard.dimension}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    shard.confidence_level === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
                    shard.confidence_level === 'medium' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {shard.confidence_level}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {shard.source_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-border/50 rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="border-b border-border/30">
        <nav className="flex gap-8 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', description: 'Summary and recent activity' },
            { id: 'crystals', label: 'Crystals', description: 'Consolidated insights' },
            { id: 'shards', label: 'Shards', description: 'Raw observations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`group pb-4 px-1 text-left transition-colors duration-200 relative flex-shrink-0 ${
                activeView === tab.id 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <div className="space-y-1">
                <div className="font-medium text-sm">{tab.label}</div>
                <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                  {tab.description}
                </div>
              </div>
              {activeView === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'crystals' && renderCrystals()}
      {activeView === 'shards' && renderShards()}
    </div>
  );
};

function InsightsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border/30 pb-4">
        <div className="flex gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InsightsTab;
