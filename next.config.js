/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lnoaurqbnmxosfaahjlv.supabase.co", // Development Supabase
      "udpygouyogrwvwjbzdul.supabase.co", // Production Supabase
    ],
  },
};

module.exports = nextConfig;
