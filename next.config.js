/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/foto',
        destination: '/om',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
