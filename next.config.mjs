/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: { unoptimized: true },
  eslint: { dirs: ["src"] },
};

export default nextConfig;
