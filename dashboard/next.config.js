// next.config.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      { source: '/api/claim/:id', destination: '/api/claim/:id' },
      { source: '/api/:path((?!claim/).*)', destination: `${API_URL}/api/:path*` },
    ]
  },
}
