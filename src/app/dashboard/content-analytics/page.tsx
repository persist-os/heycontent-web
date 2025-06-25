'use client'

import { useSearchParams } from 'next/navigation'
import { redirect } from 'next/navigation'

const ContentAnalyticsPage = () => {
  const searchParams = useSearchParams()
  const analyticsId = searchParams.get('analyticsId')
  const platform = searchParams.get('platform')
  const tab = searchParams.get('tab')
  
  // Preserve parameters when redirecting
  const params = new URLSearchParams()
  if (tab) params.set('tab', tab)
  if (analyticsId) params.set('analyticsId', analyticsId)
  if (platform) params.set('platform', platform)
  
  const redirectUrl = `/dashboard/content-hub${params.toString() ? `?${params.toString()}` : ''}`
  redirect(redirectUrl)
}

export default ContentAnalyticsPage
