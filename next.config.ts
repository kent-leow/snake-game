import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build configuration for production deployment
  eslint: {
    // Only ignore during production builds, keep linting for development
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // TypeScript configuration
  typescript: {
    // Type-check during build but don't fail build on warnings
    ignoreBuildErrors: false,
  },

  // Production optimizations - simplified for serverless
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Compression
  compress: true,

  // Asset optimization - simplified
  images: {
    domains: ['vercel.app'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Performance optimizations - simplified for serverless
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },

  // Headers for better performance and security
  async headers() {
    const headers = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    const cacheHeaders = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ];

    return [
      {
        source: '/(.*)',
        headers,
      },
      {
        source: '/health.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: cacheHeaders,
      },
      {
        source: '/favicon.ico',
        headers: cacheHeaders,
      },
      {
        source: '/static/:path*',
        headers: cacheHeaders,
      },
    ];
  },

  // Redirects for performance
  async redirects() {
    return [
      {
        source: '/health',
        destination: '/api/health',
        permanent: true,
      },
    ];
  },

  // Rewrites for clean URLs
  async rewrites() {
    return [
      {
        source: '/healthz',
        destination: '/api/health',
      },
      {
        source: '/ping',
        destination: '/health.txt',
      },
    ];
  },
};

export default nextConfig;
