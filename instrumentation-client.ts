import posthog from "posthog-js"

// Only initialize if analytics is explicitly enabled
if (
  typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/_data",
    ui_host: "https://us.posthog.com",
    defaults: '2025-05-24',
    capture_pageview: false,  // Handle pageviews manually for better control
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}

export default posthog;