import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/portfolio',
        destination: 'https://sevarchky.my.id',
        permanent: true,
      },
      {
        source: '/portfolio/:path*',
        destination: 'https://sevarchky.my.id/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
