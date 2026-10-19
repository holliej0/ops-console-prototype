/** @type {import('next').NextConfig} */
// Static export so the prototype can be hosted free on GitHub Pages.
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH to "/<repo-name>".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
