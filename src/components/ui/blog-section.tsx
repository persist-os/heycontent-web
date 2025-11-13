'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ArrowRight, Code2, Palette, Zap } from 'lucide-react'
import { T } from '@/components/translation'

const categoryConfig = {
  code: {
    icon: Code2,
    label: 'Code',
    color: 'from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10',
    borderColor: 'border-blue-500/30 dark:border-blue-500/20',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  ux: {
    icon: Zap,
    label: 'UX',
    color: 'from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10',
    borderColor: 'border-purple-500/30 dark:border-purple-500/20',
    textColor: 'text-purple-600 dark:text-purple-400'
  },
  design: {
    icon: Palette,
    label: 'Design',
    color: 'from-orange-500/20 to-amber-500/20 dark:from-orange-500/10 dark:to-amber-500/10',
    borderColor: 'border-orange-500/30 dark:border-orange-500/20',
    textColor: 'text-orange-600 dark:text-orange-400'
  }
}

export function BlogSection() {
  const router = useRouter()
  const blogPosts = useQuery(api.blogPostQueries.getAllBlogPosts, { status: 'published' })
  
  // Get featured posts (first 3 from series)
  const featuredPosts = useMemo(() => {
    if (!blogPosts) return []
    return blogPosts
      .filter(post => post.series)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, 3)
  }, [blogPosts])

  const handlePostClick = (slug: string) => {
    router.push(`/blog/${slug}`)
  }

  if (blogPosts === undefined) {
    return (
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.01] dark:from-background dark:via-primary/[0.01] dark:to-accent/[0.005] min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground"><T context="blog.loading">Loading blog posts...</T></p>
        </div>
      </section>
    )
  }

  const hasNoPosts = blogPosts.length === 0

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.01] dark:from-background dark:via-primary/[0.01] dark:to-accent/[0.005] min-h-screen flex items-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] bg-gradient-to-br from-primary/[0.12] to-accent/[0.08] dark:from-primary/[0.06] dark:to-accent/[0.04] rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-accent/[0.10] to-primary/[0.07] dark:from-accent/[0.05] dark:to-primary/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          {/* Header */}
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/[0.15] to-accent/[0.12] dark:from-primary/[0.08] dark:to-accent/[0.06] border border-primary/[0.25] dark:border-primary/[0.15]">
              <Code2 className="w-4 h-4 text-foreground/70" />
              <span className="text-xs sm:text-sm font-medium text-foreground/80 uppercase tracking-wide">
                <T context="blog.badge">Technical Blog</T>
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-light text-foreground leading-tight">
              <T context="blog.title">Inside HeyContext</T>
            </h2>
            <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed">
              <T context="blog.subtitle">Deep dives into code, UX, and design. Building the autonomous work OS, one article at a time.</T>
            </p>
          </div>

          {/* Empty State */}
          {hasNoPosts && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
              <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/5">
                  <Code2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary/60" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground">
                    <T context="blog.empty.title">Blog Posts Coming Soon</T>
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed">
                    <T context="blog.empty.description">We're crafting insightful articles about code, UX, and design. Stay tuned for deep dives into building the autonomous work OS.</T>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Featured Series Posts */}
          {!hasNoPosts && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground">
                  <T context="blog.featured.title">Featured Series</T>
                </h3>
                <button
                  onClick={() => router.push('/blog')}
                  className="group flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  <T context="blog.featured.viewAll">View All</T>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredPosts.map((post, index) => {
                const category = categoryConfig[post.category]
                const CategoryIcon = category.icon
                
                return (
                  <article
                    key={post.slug}
                    onClick={() => handlePostClick(post.slug)}
                    className="group relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card/80 via-primary/[0.05] to-accent/[0.03] dark:from-card/30 dark:via-primary/[0.02] dark:to-accent/[0.01] backdrop-blur-lg border border-primary/[0.20] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.10] dark:shadow-primary/[0.05] hover:border-primary/[0.40] dark:hover:border-primary/[0.20] hover:shadow-xl hover:shadow-primary/[0.20] dark:hover:shadow-primary/[0.10] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    {/* Series Badge */}
                    {post.series && (
                      <div className="absolute top-4 right-4">
                        <div className="px-2 py-1 rounded-md bg-gradient-to-r from-primary/[0.20] to-accent/[0.15] dark:from-primary/[0.10] dark:to-accent/[0.08] border border-primary/[0.30] dark:border-primary/[0.15]">
                          <span className="text-xs font-medium text-foreground/70">
                            <T context="blog.part">Part</T> {post.order}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} border ${category.borderColor}`}>
                        <CategoryIcon className={`w-4 h-4 ${category.textColor}`} />
                      </div>
                      <span className={`text-xs font-medium ${category.textColor}`}>
                        {category.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground leading-tight group-hover:text-foreground/90 transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
                        {post.description}
                      </p>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 pt-2 border-t border-primary/[0.15] dark:border-primary/[0.08]">
                        <span className="text-xs text-muted-foreground">
                          {post.readTime}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </article>
                )
              })}
              </div>
            </div>
          )}

          {/* All Posts Grid */}
          {!hasNoPosts && (
            <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground">
                <T context="blog.all.title">All Articles</T>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {blogPosts?.map((post, index) => {
                const category = categoryConfig[post.category]
                const CategoryIcon = category.icon
                
                return (
                  <article
                    key={post.slug}
                    onClick={() => handlePostClick(post.slug)}
                    className="group relative p-5 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/60 via-primary/[0.03] to-accent/[0.02] dark:from-card/20 dark:via-primary/[0.01] dark:to-accent/[0.005] backdrop-blur-lg border border-primary/[0.15] dark:border-primary/[0.08] hover:border-primary/[0.30] dark:hover:border-primary/[0.15] hover:shadow-lg hover:shadow-primary/[0.15] dark:hover:shadow-primary/[0.05] transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-4">
                      {/* Category Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br ${category.color} border ${category.borderColor}`}>
                        <CategoryIcon className={`w-4 h-4 ${category.textColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base sm:text-lg font-medium text-foreground leading-tight group-hover:text-foreground/90 transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          {post.series && (
                            <span className="flex-shrink-0 text-xs font-medium text-muted-foreground/60 px-2 py-1 rounded bg-primary/[0.10] dark:bg-primary/[0.05]">
                              {post.order}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {post.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{post.readTime}</span>
                          {post.publishedAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </>
                          )}
                          {!post.publishedAt && post.date && (
                            <>
                              <span>•</span>
                              <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
          )}

          {/* CTA */}
          {!hasNoPosts && (
            <div className="text-center pt-8 sm:pt-12">
            <button
              onClick={() => router.push('/blog')}
              className="group inline-flex items-center gap-2 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-foreground text-background text-sm sm:text-base lg:text-lg font-medium hover:bg-foreground/90 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-xl min-w-[180px] sm:min-w-[200px] lg:min-w-[240px]"
            >
              <span><T context="blog.cta">Explore All Articles</T></span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}

