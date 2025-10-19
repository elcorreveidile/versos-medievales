/** @type {import('next').NextConfig} */
module.exports = {
  // 👇 NO pongas output:'export' en Vercel si usas /api
  images: { unoptimized: false }, // Vercel sí optimiza imágenes
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
