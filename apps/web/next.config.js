/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@wise/ui", "@wise/shared"],
};

module.exports = nextConfig;
