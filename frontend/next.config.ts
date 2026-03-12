import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dockerode (and its deps) are Node-only and break Turbopack's server bundling.
  // Keep them external so they're required at runtime by Node.
  serverExternalPackages: ["dockerode", "docker-modem", "ssh2"],
};

export default nextConfig;
