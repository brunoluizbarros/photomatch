import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Única fonte da marca — corpo e exibição (títulos, CTAs, números grandes)
// vêm do mesmo Inter, diferenciados por peso via globals.css (.font-display
// força 800/tracking-tight). Carregada uma vez aqui em vez de duplicada por
// rota.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'PhotoMatch',
  description: 'Encontre suas fotos de evento por reconhecimento facial.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
