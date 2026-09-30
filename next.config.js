/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nessun ignoreBuildErrors: un errore di tipo nelle API deve bloccare il deploy,
  // non arrivare in produzione. (Il componente UI legacy ha ancora @ts-nocheck.)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "occhialematto.com" },
      { protocol: "https", hostname: "www.occhialematto.com" },
      { protocol: "https", hostname: "cdn.shopify.com" }
    ]
  }
};

module.exports = nextConfig;
