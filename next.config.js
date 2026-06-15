/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode
  reactStrictMode: true,

  // Skip TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image domains will be configured by Asif when real assets are added
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Magic link short URL → API handler
  async rewrites() {
    return [
      {
        source: "/join/:token",
        destination: "/api/join/:token",
      },
    ];
  },
};

module.exports = nextConfig;
