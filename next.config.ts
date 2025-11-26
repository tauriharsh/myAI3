import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase API payload size for large file uploads
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
