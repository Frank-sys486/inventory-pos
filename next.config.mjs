/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pouchdb', 'pouchdb-find', 'leveldown', 'level'],
};

export default nextConfig;
