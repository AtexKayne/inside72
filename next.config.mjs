/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Сборка ходит в Supabase при prerender; без лимита параллелизма CI ловит statement timeout.
  staticPageGenerationTimeout: 180,
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
