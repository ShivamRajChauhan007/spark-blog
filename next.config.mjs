/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"]
  },
  webpack: (config) => {
    // shiki uses esm.sh-style imports
    config.module.rules.push({ test: /\.wasm$/, type: "asset/resource" });
    return config;
  }
};
export default nextConfig;
