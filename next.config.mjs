/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    DROPBOX_CLIENT_ID: process.env.DROPBOX_CLIENT_ID,
    DROPBOX_CLIENT_SECRET: process.env.DROPBOX_CLIENT_SECRET,
    DROPBOX_REDIRECT_URI: process.env.DROPBOX_REDIRECT_URI,
    DROPBOX_FOLDER: process.env.DROPBOX_FOLDER,
  },
}

export default nextConfig
