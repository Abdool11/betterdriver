/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — creates .next/standalone with a self-contained Node.js server.
  // This means no npm install is needed on the production server.
  output: "standalone",

  // Strict mode
  reactStrictMode: true,

  // Skip TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
