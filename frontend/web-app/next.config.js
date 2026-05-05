/** @type {import('next').NextConfig} */
const isDockerBuild = process.env.DOCKER_BUILD === "1";

const nextConfig = {
  output: isDockerBuild ? "standalone" : undefined,
  transpilePackages: ["@bicap/ui", "@bicap/auth", "@bicap/api-client", "@bicap/types"],
  // NEXT_PUBLIC_API_URL được inline vào bundle JS chạy trên TRÌNH DUYỆT, nên phải
  // là URL trình duyệt resolve được (qua nginx :80), KHÔNG phải hostname container.
  // Truyền qua build args trong docker-compose để override khi cần.
  env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api" },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

module.exports = nextConfig;
