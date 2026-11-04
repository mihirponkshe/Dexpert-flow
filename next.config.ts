import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  // deck.gl and luma.gl are ESM-only — tell Next.js to transpile them
  transpilePackages: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/geo-layers',
    '@deck.gl/mapbox',
    '@luma.gl/core',
    '@luma.gl/engine',
    '@luma.gl/shadertools',
    '@luma.gl/webgl',
    '@math.gl/core',
    '@math.gl/web-mercator',
  ],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
