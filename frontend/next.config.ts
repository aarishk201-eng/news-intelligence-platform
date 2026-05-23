import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // ─── Compression ───────────────────────────────────────────────────────────────
  compress: true,

  // ─── Image Optimization ────────────────────────────────────────────────────────
  images: {
    // Accept images from known news sources
    remotePatterns: [
      { protocol: 'https', hostname: '**.bbc.co.uk' },
      { protocol: 'https', hostname: '**.bbc.com' },
      { protocol: 'https', hostname: '**.nytimes.com' },
      { protocol: 'https', hostname: '**.reuters.com' },
      { protocol: 'https', hostname: '**.cnn.com' },
      { protocol: 'https', hostname: '**.theguardian.com' },
      { protocol: 'https', hostname: '**.washingtonpost.com' },
      { protocol: 'https', hostname: '**.aljazeera.com' },
      { protocol: 'https', hostname: '**.apnews.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Catch-all for newsdata.io thumbnails (various CDNs)
      { protocol: 'https', hostname: '**' },
    ],
    // Prefer AVIF → WebP → original (Next.js negotiates automatically)
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for at least 1 hour (CDN-friendly)
    minimumCacheTTL: 3600,
    // Limit device sizes to reduce unnecessary image variants
    deviceSizes: [640, 828, 1080, 1200, 1920],
    // Limit image widths requested
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ─── API Rewrite (proxies /api/* to backend, avoids CORS in browser) ──────────
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },

  // ─── Security Headers ──────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // ── Static asset caching ──────────────────────────────────────────────────
      {
        // Cache build assets aggressively, but DO NOT cache the image optimizer endpoint.
        // Caching `/_next/image` as immutable can permanently cache transient 404s in dev.
        source: '/(_next/static|favicon.ico)(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ─── Bundle Optimizations ─────────────────────────────────────────────────────
  experimental: {
    // Tree-shake large icon/chart/animation libraries — only import used icons
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', '@radix-ui/react-dialog'],
  },

  // ─── Webpack: bundle analyzer (only in analyze mode) ─────────────────────────
  ...(process.env.ANALYZE === 'true' && {
    webpack(config: any) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static' }));
      return config;
    },
  }),
};

export default nextConfig;
