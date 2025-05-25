/** @type {import('next').NextConfig} */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// List of files to copy to the standalone output
const copyFiles = [
  { from: 'firebase_key.json', to: 'firebase_key.json' },
  // Add other files that need to be copied to the standalone output
];

const nextConfig = {
  // Enable standalone output for Cloud Run
  output: 'standalone',
  
  // Enable React 18 features
  reactStrictMode: true,
  
  // Generate source maps in production for debugging
  productionBrowserSourceMaps: true,
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Configure images
  images: {
    unoptimized: true, // Required for static export
    domains: [
      'localhost',
      '*.googleapis.com',
      '*.firebaseio.com',
      '*.convex.cloud',
      'convex.domains',
      'heycontent-web-216038426364.us-central1.run.app',
      'i.ytimg.com',
      'img.youtube.com',
    ],
  },
  
  
  // Configure static file handling
  experimental: {
    // Enable app directory
    appDir: true,
    
    // Optimizations
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui'],
    
    // Server Actions configuration
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // Optimize font loading
    optimizeFonts: {
      inlineFonts: true,
      preload: true,
      subsets: ['latin'],
    },
    
    // Enable incremental cache for better performance
    incrementalCacheHandlerPath: require.resolve('./cache-handler.js'),
    
    // Enable server components external packages
    serverComponentsExternalPackages: ['@radix-ui/react-dialog'],
  },
  
  // Configure output file tracing
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    outputFileTracingExcludes: {
      '*': [
        'node_modules/**/@swc/core-linux-x64-gnu',
        'node_modules/**/@swc/core-linux-x64-musl',
        'node_modules/**/@esbuild/linux-x64',
      ],
    },
  },
  
  // Configure asset prefix for static files
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Ensure proper handling of static files
  webpack: (config, { isServer }) => {
    // Add module resolution fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      net: false,
      dns: false,
      child_process: false,
      tls: false,
    };

    // Add module resolution aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@/src': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/convex': path.resolve(__dirname, 'convex'),
      '@/app': path.resolve(__dirname, 'app')
    };

    // Handle static files
    if (!isServer) {
      config.resolve.alias['@/public'] = path.resolve(__dirname, 'public');
    }

    // Copy files for standalone output
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: copyFiles.map(({ from, to }) => ({
            from: path.resolve(__dirname, from),
            to: path.resolve(__dirname, '.next/standalone', to),
          })),
        })
      );
    }

    return config;
  },
  
  // Configure output file tracing
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    outputFileTracingExcludes: {
      '*': [
        'node_modules/**/*',
        '.next/**/*',
        '**/node_modules/**/*',
        '**/.next/**/*',
      ],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable experimental features that might help with module resolution
    optimizePackageImports: ['@radix-ui'],
    optimizeCss: true,
  },
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
  webpack: (config, { isServer }) => {
    // Add module resolution fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      net: false,
      dns: false,
      child_process: false,
      tls: false,
    };

    // Add module resolution aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@/src': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/convex': path.resolve(__dirname, 'convex'),
      '@/app': path.resolve(__dirname, 'app')
    };

    // Important: return the modified config
    return config;
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