/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/anmeld',
        destination: 'https://g.page/r/CbHZ1EYRhAzlEBM/review',
        permanent: false,
      },
      {
        source: '/foto',
        destination: '/om',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
