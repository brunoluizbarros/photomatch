import type { Metadata } from 'next';
import { Anton, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// Fonte de exibição da marca (títulos, CTAs, números grandes) — usada na
// home, no admin e na página pública do evento, por isso carregada uma vez
// aqui em vez de duplicada por rota. Só existe em peso 400 no Google Fonts.
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PhotoMatch',
  description: 'Encontre suas fotos de evento por reconhecimento facial.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${anton.variable}`}>
      <body>{children}</body>
    </html>
  );
}
