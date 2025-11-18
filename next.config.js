/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of files to copy to the standalone output
const copyFiles = [
  { from: 'firebase_key.json', to: 'firebase_key.json' },
  // Add other files that need to be copied to the standalone output
];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self';",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://apis.google.com https://accounts.google.com https://googleads.g.doubleclick.net;",
      "style-src 'self' 'unsafe-inline';",
      "img-src * blob: data:;",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://js.stripe.com https://api.stripe.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://va.vercel-scripts.com https://backend.hicontent.co http://backend.hicontent.co https://content-backend-staging-216038426364.us-central1.run.app http://127.0.0.1:8000 http://localhost:8000 https://us-central1-content-454219.cloudfunctions.net https://storage.googleapis.com https://*.googleapis.com https://*.gstatic.com https://apis.google.com https://accounts.google.com https://www.google.com;",
      "font-src 'self' data:;",
      "frame-src 'self' https://js.stripe.com https://accounts.google.com https://*.firebaseapp.com https://www.googletagmanager.com;",
    ].join(' ')
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true, // Enable gzip compression for better performance
  
  // SEO optimizations
  generateEtags: true,
  
  // Image optimization for better SEO and performance
  images: {
    formats: ['image/avif', 'image/webp'], // Modern image formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    domains: [
      'localhost',
      '*.googleapis.com',
      '*.firebaseio.com',
      '*.convex.cloud',
      'convex.domains',
      'heycontent-web-216038426364.us-central1.run.app',
      'i.ytimg.com',
      'img.youtube.com',
      'scontent-ord5-2.cdninstagram.com', // Instagram CDN
    ],
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
      {
        protocol: 'https',
        hostname: 'scontent-ord5-2.cdninstagram.com', // Instagram CDN
      },
    ],
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      net: false,
      dns: false,
      child_process: false,
      tls: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@/src': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/convex': path.resolve(__dirname, 'convex'),
      '@/app': path.resolve(__dirname, 'app')
    };
    if (!isServer) {
      config.resolve.alias['@/public'] = path.resolve(__dirname, 'public');
    }
    return config;
  },

  // PostHog rewrites for analytics ingestion (ad-blocker resistant path)
  async rewrites() {
    return [
      {
        source: '/_data/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/_data/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      // Legacy iOS Safari requests apple-touch-icon-precomposed.png
      // Rewrite to serve apple-touch-icon.png instead
      {
        source: '/apple-touch-icon-precomposed.png',
        destination: '/apple-touch-icon.png',
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default {
  ...nextConfig,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};