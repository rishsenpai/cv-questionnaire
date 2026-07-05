import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint runt nog wel via `npm run lint`. Build blokkeren op pre-existing
    // setState-in-effect waarschuwingen helpt nu niet — fix later in aparte PR.
    ignoreDuringBuilds: true,
  },
  turbopack: {},
  // 'natural' heeft optionele native deps (webworker-threads, lapack via
  // sylvester) die webpack niet kan bundlen. Door 'm extern te markeren
  // wordt 'ie at-runtime geladen — optionele deps blijven dan gewoon optioneel.
  serverExternalPackages: ['natural'],
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
  transpilePackages: ['motion'],
  // Basis security-headers voor alle routes. Bewust géén strikte Content-Security-Policy
  // hier — die vergt nonce-gebaseerde inline-scripts en zou Next's runtime breken;
  // apart traject. Deze headers zijn veilig en breken niets:
  // - X-Frame-Options DENY: admin-console niet in een iframe → geen clickjacking.
  // - nosniff: browser mag content-type niet raden (MIME-confusion).
  // - Referrer-Policy: lek geen volledige URL's naar externe sites.
  // - Permissions-Policy: schakel ongebruikte krachtige browser-API's uit.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
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
