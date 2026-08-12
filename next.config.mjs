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
  async redirects() {
    return [
      { source: "/arenda", destination: "/", permanent: true },
      { source: "/about", destination: "/", permanent: true },
      { source: "/prices", destination: "/", permanent: true },
      { source: "/news", destination: "/", permanent: true },
      { source: "/news/:id", destination: "/", permanent: true },
      { source: "/gallery", destination: "/", permanent: true },
      { source: "/teachers", destination: "/", permanent: true },
    ];
  },
  // Сборка ходит в Supabase при prerender; без лимита параллелизма CI ловит statement timeout.
  experimental: {
    cpus: 1,
    staticPageGenerationTimeout: 180,
  },
};

export default nextConfig;
