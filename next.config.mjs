/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Playwright is only ever imported inside the /api/pdf route handler (Node
  // runtime). Keep it external so Next doesn't try to bundle Chromium.
  serverExternalPackages: ["playwright", "playwright-core"],
};

export default nextConfig;
