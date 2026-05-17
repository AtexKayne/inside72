/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["node-ical"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  sassOptions: {
    includePaths: ["./src/styles"],
  },
};

export default nextConfig;
