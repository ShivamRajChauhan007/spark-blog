/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 uses Turbopack by default — leave it alone.
  turbopack: {},
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};
export default nextConfig;
