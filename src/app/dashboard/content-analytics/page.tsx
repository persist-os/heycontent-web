import { redirect } from 'next/navigation'

const ContentAnalyticsPage = () => {
  redirect('/dashboard/content-hub?tab=posts')
}

export default ContentAnalyticsPage
