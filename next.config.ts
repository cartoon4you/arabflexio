import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  eslint: {
    // ESLint is verified separately via lint_applet; disabling during next build saves ~500MB memory
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Run Webpack in the main Node process to eliminate multi-process memory duplication in container
    webpackBuildWorker: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.downet.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.downet.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "downet.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "akwam.ss",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.akwam.ss",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.akwam.link",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "akwam.cz",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.akwam.cz",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.akwam.to",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
