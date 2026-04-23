/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',   // ← BẮT BUỘC để Dockerfile hoạt động
};

module.exports = nextConfig;

