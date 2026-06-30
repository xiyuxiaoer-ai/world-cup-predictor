import type { NextConfig } from "next";
import { execSync } from "child_process";

const gitCommit = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    BUILD_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || gitCommit,
  },
};

export default nextConfig;
