/**
 * `STATIC_EXPORT=1` builds a hostable copy with no server behind it
 * (`npm run build:static`); `BASE_PATH` mounts it under a subdirectory, which
 * is what GitHub Pages serves a project site from.
 */
const basePath = process.env.BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(basePath === "" ? {} : { basePath }),
  ...(process.env.STATIC_EXPORT === "1"
    ? { output: "export", images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
