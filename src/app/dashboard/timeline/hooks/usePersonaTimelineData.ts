import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useMemo, useCallback } from 'react'
import { calculatePersonaFolderData, PersonaFolderData } from '../utils/personaDataCalculator'

/**
 * Main hook for fetching and aggregating all timeline data
 * Now uses single bundled query for optimal performance
 */
export function usePersonaTimelineData(userId: string | undefined) {
  // Single bundled query replaces 13+ separate queries
  const timelineData = useQuery(
    api.timelineQueries.getTimelineData,
    userId ? { userId } : 'skip'
  )
  
  // Extract data from bundled response
  const conversations = timelineData?.conversations
  const notes = timelineData?.notes
  const personas = timelineData?.personas
  const instagramPosts = timelineData?.instagramPosts
  const youtubeVideos = timelineData?.youtubeVideos
  const analytics = timelineData?.analytics
  
  // Memoize content aggregation with proper dependencies
  const allContentData = useMemo(() => {
    if (!instagramPosts && !youtubeVideos) return []
    
    const content = []
    
    // Add Instagram posts as content (simplified)
    if (instagramPosts?.length) {
      const instagramContent = instagramPosts.map(post => ({
        id: post.postId,
        type: 'content',
        title: post.data?.caption?.substring(0, 50) + '...' || 'Instagram Post',
        date: new Date(post.data?.timestamp || post.createdAt),
        platform: 'Instagram',
        preview: post.data?.caption || 'No caption'
      }))
      content.push(...instagramContent)
    }
    
    // Add YouTube videos as content (simplified)
    if (youtubeVideos?.length) {
      const youtubeContent = youtubeVideos.map(video => ({
        id: video.videoId,
        type: 'content',
        title: video.snippet?.title || 'YouTube Video',
        date: new Date(video.snippet?.published_at || video.createdAt),
        platform: 'YouTube',
        preview: video.snippet?.description?.substring(0, 100) || 'No description'
      }))
      content.push(...youtubeContent)
    }
    
    return content
  }, [instagramPosts, youtubeVideos])
  
  // Analytics data from bundled response
  const allAnalyticsData = useMemo(() => {
    console.log('🔍 Analytics Debug - Raw analytics data:', analytics)
    
    if (!analytics) {
      console.log('❌ No analytics data found')
      return []
    }
    
    const analyticsArray = []
    
    // Add YouTube batch insights if available
    console.log('🔍 YouTube Analytics:', analytics.youtubeAnalytics)
    if (analytics.youtubeAnalytics?.insights?.insights && Array.isArray(analytics.youtubeAnalytics.insights.insights)) {
      const youtubeAnalysis = analytics.youtubeAnalytics;
      const insightsArray = youtubeAnalysis.insights.insights;
      const analysisDate = new Date(youtubeAnalysis.updatedAt || youtubeAnalysis.createdAt || youtubeAnalysis._creationTime || Date.now());
      
      console.log(`✅ Found ${insightsArray.length} YouTube insights, analysis date:`, analysisDate)
      
      insightsArray.forEach((insight, idx) => {
        analyticsArray.push({
          id: `youtube-batch-${idx}`,
          type: 'analytics',
          title: insight.title || 'YouTube Batch Insight',
          date: analysisDate,
          createdAt: analysisDate,
          metric: insight.impact || 'Insight',
          value: null, // No numeric value for batch insights
          trend: 'stable',
          period: 'Batch Analysis',
          preview: insight.expectedOutcome || '',
          platform: 'YouTube'
        });
      });
    } else {
      console.log('❌ No YouTube insights found or invalid structure')
    }
    
    // Add Instagram analytics if available
    console.log('🔍 Instagram Analytics:', analytics.instagramAnalytics)
    if (analytics.instagramAnalytics?.insights) {
      console.log('🔍 Instagram Insights Structure:', analytics.instagramAnalytics.insights)
      
      if (analytics.instagramAnalytics.insights.overview) {
        const insights = analytics.instagramAnalytics.insights
        // Use the analysis creation date, not current date
        const analysisDate = new Date(analytics.instagramAnalytics._creationTime || analytics.instagramAnalytics.updatedAt || Date.now())
        
        console.log('✅ Found Instagram insights, analysis date:', analysisDate)
        
        analyticsArray.push({
          id: 'instagram-engagement',
          type: 'analytics',
          title: 'Instagram Engagement Rate',
          date: analysisDate, // Use actual analysis date
          createdAt: analysisDate, // Add for consistency
          metric: 'Engagement Rate',
          value: insights.overview.averageEngagementRate || 0,
          trend: 'stable',
          period: 'Last 30 days',
          preview: 'Instagram engagement metrics and performance analysis',
          platform: 'Instagram'
        })
        
        if (insights.overview.totalReach) {
          analyticsArray.push({
            id: 'instagram-reach',
            type: 'analytics',
            title: 'Instagram Audience Reach',
            date: analysisDate, // Use actual analysis date
            createdAt: analysisDate, // Add for consistency
            metric: 'Reach',
            value: insights.overview.totalReach || 0,
            trend: 'up',
            period: 'This month',
            preview: 'Geographic distribution and audience reach analysis',
            platform: 'Instagram'
          })
        }
      } else if (analytics.instagramAnalytics.insights.insights && Array.isArray(analytics.instagramAnalytics.insights.insights)) {
        const insightsArray = analytics.instagramAnalytics.insights.insights
        const analysisDate = new Date(analytics.instagramAnalytics._creationTime || analytics.instagramAnalytics.updatedAt || Date.now())
        
        console.log(`✅ Found ${insightsArray.length} Instagram insights, analysis date:`, analysisDate)
        
        insightsArray.forEach((insight, idx) => {
          analyticsArray.push({
            id: `instagram-insight-${idx}`,
            type: 'analytics',
            title: insight.title || insight.type || `Instagram Insight ${idx + 1}`,
            date: analysisDate,
            createdAt: analysisDate,
            metric: insight.category || insight.type || 'Insight',
            value: insight.value || null,
            trend: 'stable',
            period: 'Analysis',
            preview: insight.description || insight.summary || insight.content || 'Instagram analytics insight',
            platform: 'Instagram'
          })
        })
      } else {
        console.log('❌ No insights.overview or insights.insights found. Available keys:', Object.keys(analytics.instagramAnalytics.insights))
      }
    } else {
      console.log('❌ No Instagram insights found or invalid structure')
    }
    
    console.log(`📊 Final analytics array: ${analyticsArray.length} items`, analyticsArray)
    return analyticsArray
  }, [analytics])

  // Memoize folder data calculation with proper dependencies
  const personaFolderData = useMemo(() => {
    if (!personas || !conversations || !notes) {
      return new Map<string, PersonaFolderData>()
    }
    
    // Only recalculate if core data actually changed
    const sortedPersonas = [...personas].sort((a, b) => a.createdAt - b.createdAt)
    
    return calculatePersonaFolderData(
      sortedPersonas,
      conversations || [],
      notes || [],
      allContentData || [],
      allAnalyticsData || []
    )
  }, [personas, conversations, notes, allContentData, allAnalyticsData])
  
  // Memoize helper functions to prevent recreation
  const getFolderDataForPersona = useCallback((personaId: string): PersonaFolderData | null => {
    return personaFolderData.get(personaId) || null
  }, [personaFolderData])
  
  const getFolderCount = useCallback((personaId: string, folderType: 'blue' | 'purple' | 'orange' | 'yellow'): number => {
    const data = personaFolderData.get(personaId)
    return data?.folders[folderType]?.count || 0
  }, [personaFolderData])
  
  const getFolderItems = useCallback((personaId: string, folderType: 'blue' | 'purple' | 'orange' | 'yellow'): any[] => {
    const data = personaFolderData.get(personaId)
    return data?.folders[folderType]?.items || []
  }, [personaFolderData])
  
  // Calculate loading state efficiently
  const isLoading = timelineData === undefined
  
  return {
    // Core data
    conversations,
    notes,
    allContentData,
    allAnalyticsData,
    personas,
    personaFolderData,
    
    // Raw analytics data
    analytics,
    
    // Helper functions
    getFolderDataForPersona,
    getFolderCount,
    getFolderItems,
    
    // Loading state
    isLoading
  }
} 