/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lnoaurqbnmxosfaahjlv.supabase.co', // Development Supabase
      },
      {
        protocol: 'https',
        hostname: 'udpygouyogrwvwjbzdul.supabase.co', // Production Supabase
      },
    ],
  },
};

module.exports = nextConfig;
