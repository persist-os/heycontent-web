'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ArrowLeft, Code2, Palette, Zap, Calendar, Clock, Home } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'

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

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const post = useQuery(api.blogPostQueries.getBlogPostBySlug, { slug })
  const allPosts = useQuery(api.blogPostQueries.getAllBlogPosts, { status: 'published' })

  if (post === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-foreground mb-4">Post Not Found</h1>
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

  const category = categoryConfig[post.category]
  const CategoryIcon = category.icon

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
        <div className="space-y-6 sm:space-y-8 mb-12">
          {/* Series Badge */}
          {post.series && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/[0.15] to-accent/[0.12] dark:from-primary/[0.08] dark:to-accent/[0.06] border border-primary/[0.25] dark:border-primary/[0.15]">
              <span className="text-xs sm:text-sm font-medium text-foreground/80">
                {post.series}
              </span>
              {post.order && allPosts && (() => {
                const seriesPosts = allPosts.filter(p => p.series === post.series)
                const maxOrder = Math.max(...seriesPosts.map(p => p.order || 0))
                return (
                  <span className="text-xs sm:text-sm font-medium text-foreground/60">
                    Part {post.order} of {maxOrder}
                  </span>
                )
              })()}
            </div>
          )}

          {/* Category */}
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} border ${category.borderColor}`}>
              <CategoryIcon className={`w-4 h-4 ${category.textColor}`} />
            </div>
            <span className={`text-sm font-medium ${category.textColor}`}>
              {category.label}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {post.authorName && (
              <div className="flex items-center gap-2">
                <span>By {post.authorName}</span>
              </div>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            {!post.publishedAt && post.date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} read</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-light prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-medium prose-em:text-foreground prose-code:text-foreground prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-primary/10 prose-pre:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary/30">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ children }) => <h1 className="text-3xl sm:text-4xl font-light text-foreground mb-6 mt-8 first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-4 mt-8 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl sm:text-2xl font-light text-foreground mb-3 mt-6 first:mt-0">{children}</h3>,
              p: ({ children }) => <p className="text-base sm:text-lg text-foreground leading-relaxed mb-4">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2 text-foreground">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-foreground">{children}</ol>,
              li: ({ children }) => <li className="text-base sm:text-lg text-foreground leading-relaxed">{children}</li>,
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                if (isBlock) {
                  return <code className="block bg-primary/10 dark:bg-primary/20 rounded-lg p-4 text-sm font-mono overflow-x-auto mb-4">{children}</code>
                }
                return <code className="bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
              },
              pre: ({ children }) => <pre className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 text-sm font-mono overflow-x-auto mb-4">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4">{children}</blockquote>,
              a: ({ href, children }) => <a href={href} className="text-primary hover:underline">{children}</a>,
              hr: () => <hr className="border-primary/20 my-8" />,
            }}
          >
            {post.content || post.description}
          </ReactMarkdown>
        </article>

        {/* Navigation */}
        {post.series && (
          <div className="mt-12 pt-8 border-t border-primary/[0.15] dark:border-primary/[0.08]">
            <div className="flex items-center justify-between">
              {post.order && post.order > 1 && allPosts && (() => {
                const prevPost = allPosts.find(p => p.series === post.series && p.order === post.order! - 1)
                return prevPost ? (
                  <button
                    onClick={() => router.push(`/blog/${prevPost.slug}`)}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Previous</span>
                  </button>
                ) : null
              })()}
              {post.order && allPosts && (() => {
                const maxOrder = Math.max(...(allPosts.filter(p => p.series === post.series).map(p => p.order || 0)))
                const nextPost = allPosts.find(p => p.series === post.series && p.order === post.order! + 1)
                return post.order! < maxOrder && nextPost ? (
                  <button
                    onClick={() => router.push(`/blog/${nextPost.slug}`)}
                    className="group ml-auto flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Next</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : null
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
