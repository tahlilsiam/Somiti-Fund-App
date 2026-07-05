import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow payment proof uploads (images / PDFs) via server actions.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
