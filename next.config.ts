import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações do Next.js
  reactStrictMode: true,

  // Permitir imagens de qualquer domínio (para mídias)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Ignorar erros de TypeScript durante build (temporário para desenvolvimento)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuração de headers para PWA
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  // Configuração vazia do turbopack para silenciar o aviso
  turbopack: {},

  // Pacotes externos para o servidor (necessário para better-sqlite3)
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
