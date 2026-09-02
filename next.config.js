/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next-v0',
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
