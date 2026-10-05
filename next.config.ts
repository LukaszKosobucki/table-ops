import type { NextConfig } from 'next';

const isGithubPages =
  process.env.GITHUB_PAGES === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages && basePath ? basePath : undefined,
  assetPrefix: isGithubPages && basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: isGithubPages,
  },
  trailingSlash: isGithubPages,
};

export default nextConfig;
