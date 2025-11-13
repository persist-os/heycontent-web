'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ArrowRight, Code2, Palette, Zap, Home } from 'lucide-react'
import Link from 'next/link'

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

export default function BlogPage() {
  const router = useRouter()
  const blogPosts = useQuery(api.blogPostQueries.getAllBlogPosts, { status: 'published' })

  const handlePostClick = (slug: string) => {
    router.push(`/blog/${slug}`)
  }

  const handleSeriesClick = (seriesName: string) => {
    const seriesSlug = seriesName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    router.push(`/blog/series/${seriesSlug}`)
  }

  // Group posts by series
  const seriesGroups = useMemo(() => {
    if (!blogPosts) return {}
    const groups: Record<string, Array<NonNullable<typeof blogPosts>[0]>> = {}
    blogPosts.forEach(post => {
      if (post.series) {
        if (!groups[post.series]) {
          groups[post.series] = []
        }
        groups[post.series].push(post)
      }
    })
    // Sort each series by order
    Object.keys(groups).forEach(series => {
      groups[series].sort((a, b) => (a.order || 0) - (b.order || 0))
    })
    return groups
  }, [blogPosts])

  // Get standalone articles (not part of any series)
  const standaloneArticles = useMemo(() => {
    if (!blogPosts) return []
    return blogPosts.filter(post => !post.series)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [blogPosts])

  // Get series articles (for display in grid, but grouped separately)
  const seriesArticles = useMemo(() => {
    if (!blogPosts) return []
    return blogPosts.filter(post => post.series)
      .sort((a, b) => {
        // Sort by series first, then by order within series
        if (a.series !== b.series) {
          return (a.series || '').localeCompare(b.series || '')
        }
        return (a.order || 0) - (b.order || 0)
      })
  }, [blogPosts])

  if (blogPosts === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const hasNoPosts = blogPosts.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.01] dark:from-background dark:via-primary/[0.01] dark:to-accent/[0.005]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-24">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Homepage</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/[0.15] to-accent/[0.12] dark:from-primary/[0.08] dark:to-accent/[0.06] border border-primary/[0.25] dark:border-primary/[0.15]">
            <Code2 className="w-4 h-4 text-foreground/70" />
            <span className="text-xs sm:text-sm font-medium text-foreground/80 uppercase tracking-wide">
              Technical Blog
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light text-foreground leading-tight">
            Inside HeyContext
          </h1>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl lg:text-2xl text-muted-foreground font-light leading-relaxed">
            Deep dives into code, UX, and design. Building the autonomous work OS, one article at a time.
          </p>
        </div>

        {/* Empty State */}
        {hasNoPosts && (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-center">
            <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/5">
                <Code2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary/60" />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground">
                  Blog Posts Coming Soon
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
                  We're crafting insightful articles about code, UX, and design. Stay tuned for deep dives into building the autonomous work OS.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground/80 font-light">
                  Check back soon for our first posts!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Series Groups */}
        {!hasNoPosts && Object.keys(seriesGroups).length > 0 && (
          <div className="mb-12 sm:mb-16 space-y-4">
            {Object.entries(seriesGroups).map(([seriesName, posts]) => (
              <div
                key={seriesName}
                onClick={() => handleSeriesClick(seriesName)}
                className="group p-5 sm:p-6 rounded-xl bg-gradient-to-br from-card/80 via-primary/[0.05] to-accent/[0.03] dark:from-card/30 dark:via-primary/[0.02] dark:to-accent/[0.01] backdrop-blur-lg border border-primary/[0.20] dark:border-primary/[0.10] shadow-lg hover:border-primary/[0.40] dark:hover:border-primary/[0.20] hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-light text-foreground mb-2 group-hover:text-foreground/90 transition-colors">
                      {seriesName}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      A {posts.length}-part series exploring the architecture, philosophy, and implementation of autonomous work systems.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Standalone Articles */}
        {!hasNoPosts && standaloneArticles.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-6 sm:mb-8">
              Standalone Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {standaloneArticles.map((post) => {
                const category = categoryConfig[post.category]
                const CategoryIcon = category.icon
                
                return (
                  <article
                    key={post.slug}
                    onClick={() => handlePostClick(post.slug)}
                    className="group relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card/80 via-primary/[0.05] to-accent/[0.03] dark:from-card/30 dark:via-primary/[0.02] dark:to-accent/[0.01] backdrop-blur-lg border border-primary/[0.20] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.10] dark:shadow-primary/[0.05] hover:border-primary/[0.40] dark:hover:border-primary/[0.20] hover:shadow-xl hover:shadow-primary/[0.20] dark:hover:shadow-primary/[0.10] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
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
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground leading-tight group-hover:text-foreground/90 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
                        {post.description}
                      </p>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 pt-2 border-t border-primary/[0.15] dark:border-primary/[0.08]">
                        <span className="text-xs text-muted-foreground">
                          {post.readTime}
                        </span>
                        {post.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {!post.publishedAt && post.date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
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

        {/* Series Articles Grid */}
        {!hasNoPosts && seriesArticles.length > 0 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-6 sm:mb-8">
              All Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {seriesArticles.map((post) => {
                const category = categoryConfig[post.category]
                const CategoryIcon = category.icon
                
                return (
                  <article
                    key={post.slug}
                    onClick={() => handlePostClick(post.slug)}
                    className="group relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card/80 via-primary/[0.05] to-accent/[0.03] dark:from-card/30 dark:via-primary/[0.02] dark:to-accent/[0.01] backdrop-blur-lg border border-primary/[0.20] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.10] dark:shadow-primary/[0.05] hover:border-primary/[0.40] dark:hover:border-primary/[0.20] hover:shadow-xl hover:shadow-primary/[0.20] dark:hover:shadow-primary/[0.10] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {/* Series Badge */}
                    {post.series && (
                      <div className="absolute top-4 right-4">
                        <div className="px-2 py-1 rounded-md bg-gradient-to-r from-primary/[0.20] to-accent/[0.15] dark:from-primary/[0.10] dark:to-accent/[0.08] border border-primary/[0.30] dark:border-primary/[0.15]">
                          <span className="text-xs font-medium text-foreground/70">
                            Part {post.order}
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
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground leading-tight group-hover:text-foreground/90 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
                        {post.description}
                      </p>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 pt-2 border-t border-primary/[0.15] dark:border-primary/[0.08]">
                        <span className="text-xs text-muted-foreground">
                          {post.readTime}
                        </span>
                        {post.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {!post.publishedAt && post.date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
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
      </div>
    </div>
  )
}

