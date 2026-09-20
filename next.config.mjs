/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `npm run build:static` produces a hostable copy with no server behind it.
  ...(process.env.STATIC_EXPORT === "1"
    ? { output: "export", images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
