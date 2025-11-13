'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ArrowLeft, Code2, Calendar, Clock, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

// Create slug from series name
function createSeriesSlug(seriesName: string): string {
  return seriesName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function SeriesPage() {
  const params = useParams()
  const router = useRouter()
  const seriesSlug = params.seriesSlug as string
  
  const allPosts = useQuery(api.blogPostQueries.getAllBlogPosts, { status: 'published' })
  
  // Find series name from posts
  const seriesName = React.useMemo(() => {
    if (!allPosts) return null
    // Find a post with matching slug, then get its series
    const matchingPost = allPosts.find(post => {
      const postSeriesSlug = post.series ? createSeriesSlug(post.series) : null
      return postSeriesSlug === seriesSlug
    })
    return matchingPost?.series || null
  }, [allPosts, seriesSlug])
  
  const seriesPosts = React.useMemo(() => {
    if (!allPosts || !seriesName) return []
    return allPosts
      .filter(post => post.series === seriesName)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [allPosts, seriesName])

  if (allPosts === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!seriesName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-foreground mb-4">Series Not Found</h1>
          <button
            onClick={() => router.push('/blog')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Blog
          </button>
        </div>
      </div>
    )
  }

  const handlePostClick = (slug: string) => {
    router.push(`/blog/${slug}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.01] dark:from-background dark:via-primary/[0.01] dark:to-accent/[0.005]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-24">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/blog')}
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Blog</span>
          </button>
          <Link
            href="/"
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Homepage</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/[0.15] to-accent/[0.12] dark:from-primary/[0.08] dark:to-accent/[0.06] border border-primary/[0.25] dark:border-primary/[0.15]">
            <Code2 className="w-4 h-4 text-foreground/70" />
            <span className="text-xs sm:text-sm font-medium text-foreground/80 uppercase tracking-wide">
              Series
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground leading-tight">
            {seriesName}
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed">
            A {seriesPosts.length}-part series exploring the architecture, philosophy, and implementation of autonomous work systems.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-light text-foreground mb-6">Table of Contents</h2>
          
          <div className="space-y-3">
            {seriesPosts.map((post, index) => (
              <article
                key={post.slug}
                onClick={() => handlePostClick(post.slug)}
                className="group relative p-6 rounded-xl bg-gradient-to-br from-card/80 via-primary/[0.05] to-accent/[0.03] dark:from-card/30 dark:via-primary/[0.02] dark:to-accent/[0.01] backdrop-blur-lg border border-primary/[0.20] dark:border-primary/[0.10] shadow-lg hover:border-primary/[0.40] dark:hover:border-primary/[0.20] hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-start gap-4">
                  {/* Part Number */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/[0.20] to-accent/[0.15] dark:from-primary/[0.10] dark:to-accent/[0.08] border border-primary/[0.30] dark:border-primary/[0.15] flex items-center justify-center">
                    <span className="text-lg font-medium text-foreground">{post.order}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-medium text-foreground leading-tight mb-2 group-hover:text-foreground/90 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                      {post.description}
                    </p>
                    
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

