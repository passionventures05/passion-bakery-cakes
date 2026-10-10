/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // static HTML/CSS/JS in ./out (no server needed)
  trailingSlash: true, // /products/ -> products/index.html (works on Cloudflare Pages + Capacitor)
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
