/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    workerThreads: false,
    cpus: 1
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data:",
              "font-src 'self'",
              "connect-src 'self' wss://*.convex.cloud https://*.convex.cloud",
              "frame-ancestors 'self'"
            ].join('; ')
          }
        ],
      },
    ]
  },
  webpack: (config) => {
    if (!config.resolve) {
      config.resolve = {}
    }
    if (!config.resolve.fallback) {
      config.resolve.fallback = {}
    }

    // Handle Node.js built-in modules
    config.resolve.fallback.fs = false
    config.resolve.fallback.path = false
    config.resolve.fallback.crypto = false
    config.resolve.fallback.stream = false
    config.resolve.fallback.util = false
    config.resolve.fallback.dns = false
    config.resolve.fallback.tty = false
    config.resolve.fallback.bcrypt = false  // Disable bcrypt in webpack
    
    return config
  },
}

export default nextConfig 