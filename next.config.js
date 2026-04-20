/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "occhialematto.com" },
      { protocol: "https", hostname: "cdn.shopify.com" }
    ]
  }
};

module.exports = nextConfig;
