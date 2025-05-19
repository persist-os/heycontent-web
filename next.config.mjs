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
              "script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://*.googleusercontent.com",
              "font-src 'self'",
              "connect-src 'self' wss://*.convex.cloud https://*.convex.cloud http://localhost:8000 http://localhost:9099 https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://backend.hicontent.co",
              "frame-ancestors 'self'",
              "frame-src 'self' https://accounts.google.com https://apis.google.com"
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
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      dns: false,
      tty: false,
      bcrypt: false  // Disable bcrypt in webpack
    };
    
    return config
  },
}

export default nextConfig 