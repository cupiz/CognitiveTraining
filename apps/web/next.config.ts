import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cog/schemas",
    "@cog/db",
    "@cog/ui",
    "@cog/game-core",
    "@cog/game-memory-matrix",
    "@cog/game-target-watch",
    "@cog/game-quick-match",
    "@cog/game-stop-signal",
    "@cog/game-rule-switch",
    "@cog/scoring",
    "@cog/adaptive",
    "@cog/planner",
    "@cog/analytics",
  ],
};

export default nextConfig;
