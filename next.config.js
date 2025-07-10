/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:*'],
    },
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
