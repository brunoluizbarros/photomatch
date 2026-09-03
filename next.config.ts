import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Teto do payload da Server Action de busca por selfie (base64 infla ~33%).
    serverActions: { bodySizeLimit: '10mb' },
  },
  webpack: (config) => {
    // Sem isso, arquivos gravados por ferramentas de automação de browser
    // dentro do projeto (ex: .playwright-mcp/) disparam recompile a cada
    // escrita — e um recompile gera mais log de HMR, que a ferramenta grava
    // de novo, num loop autoalimentado que trava o dev server.
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/.git/**', '**/.playwright-mcp/**'],
    };
    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        // Presigned URLs do bucket (Railway Object Storage, backend Tigris) —
        // servidas direto de storageapi.dev, não de railway.app.
        protocol: 'https',
        hostname: '*.storageapi.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
