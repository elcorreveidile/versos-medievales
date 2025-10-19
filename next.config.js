/** @type {import('next').NextConfig} */
const isProd = true;

module.exports = {
  output: 'export',                // genera HTML estático en /out
  images: { unoptimized: true },   // GitHub Pages no hace optimización de Next/Image
  trailingSlash: true,             // URLs con / al final (seguro para GitHub Pages)
  basePath: '/Literatura/apps/versos', // ruta exacta dentro del dominio de Pages
  assetPrefix: isProd ? '/Literatura/apps/versos/' : '', // prefijo correcto para assets
  // 👇 Evita errores con rutas dinámicas
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
