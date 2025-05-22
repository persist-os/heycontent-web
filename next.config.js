/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.firebaseio.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'identitytoolkit.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://*.stripe.com",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https://*.stripe.com",
              "style-src 'self' 'unsafe-inline' https://*.stripe.com",
              "img-src 'self' blob: data: *.ytimg.com *.youtube.com https://*.stripe.com",
              "font-src 'self' https://*.stripe.com",
              "connect-src 'self' wss://*.convex.cloud https://*.convex.cloud http://localhost:9099 https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com http://localhost:8000 https://backend.hicontent.co https://*.stripe.com",
              "frame-src 'self' https://*.stripe.com https://js.stripe.com",
              "frame-ancestors 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 