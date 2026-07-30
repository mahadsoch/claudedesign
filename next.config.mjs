/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Playwright is only ever imported inside the /api/pdf route handler (Node
  // runtime). Keep it external so Next doesn't try to bundle Chromium.
  // pptxgenjs is only used inside the /api/pptx route (Node runtime) and pulls
  // in jszip + image-size; keeping it external avoids bundling it for the client.
  serverExternalPackages: ["playwright", "playwright-core", "pptxgenjs"],
};

export default nextConfig;
