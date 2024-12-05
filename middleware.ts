import { auth } from './app/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  
  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/ai-insights/:path*',
    '/audience/:path*',
    '/chat/:path*',
    '/partnerships/:path*',
    '/settings/:path*'
  ]
} 