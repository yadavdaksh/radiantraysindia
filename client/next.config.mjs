/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-50c321b38e6d4c5c9e421dfd9a44e5.r2.dev", // generic placeholder matching the format
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
