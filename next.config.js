/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://*.convex.cloud https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 