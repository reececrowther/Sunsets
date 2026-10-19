import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/postprocessing',
    'postprocessing',
  ],
  // Slackwater packages are ESM-only — exclude from webpack bundling so
  // Node.js can load them natively in server routes and cron handlers.
  serverExternalPackages: ['@slackwater/engine', '@slackwater/database'],
};

export default nextConfig;
