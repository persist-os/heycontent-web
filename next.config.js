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
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com;",
      "style-src 'self' 'unsafe-inline';",
      "img-src * blob: data:;",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://js.stripe.com https://api.stripe.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://va.vercel-scripts.com https://backend.incontent.co http://127.0.0.1:8000 http://localhost:8000 https://*.googleapis.com https://*.cloudfunctions.net https://storage.googleapis.com https://*.storage.googleapis.com https://us-central1-content-454219.cloudfunctions.net;",
      "font-src 'self' data:;",
      "frame-src https://js.stripe.com;",
    ].join(' ')
  }
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: [
      'localhost',
      '*.googleapis.com',
      '*.firebaseio.com',
      '*.convex.cloud',
      'convex.domains',
      'heycontent-web-216038426364.us-central1.run.app',
      'i.ytimg.com',
      'img.youtube.com',
      'storage.googleapis.com',
      'smart-notes-image-upload.storage.googleapis.com',
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
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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