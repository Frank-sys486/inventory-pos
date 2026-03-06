/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pouchdb', 'pouchdb-find', 'leveldown', 'level'],
  },
};

export default nextConfig;
