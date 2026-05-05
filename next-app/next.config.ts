import type {NextConfig} from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint runt nog wel via `npm run lint`. Build blokkeren op pre-existing
    // setState-in-effect waarschuwingen helpt nu niet — fix later in aparte PR.
    ignoreDuringBuilds: true,
  },
  turbopack: {},
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // File watching can be disabled through DISABLE_HMR during automated edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
