'use client';

import { Card } from '@/components/ui/card';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

// QR code da página pública do álbum, gerado no navegador (a URL depende do
// domínio de quem está acessando o admin) — pronto pra imprimir/divulgar no
// evento.
export function QrCodeCard({ slug }: { slug: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    const url = `${window.location.origin}/e/${slug}`;
    setPublicUrl(url);
    QRCode.toDataURL(url, { width: 480, margin: 2 }).then(setDataUrl);
  }, [slug]);

  if (!dataUrl) return null;

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <h2 className="self-start font-display uppercase">QR Code</h2>
      <img src={dataUrl} alt="QR code da página pública do álbum" className="size-40 rounded-lg" />
      <p className="break-all text-[var(--muted-foreground)] text-xs">{publicUrl}</p>
      <a
        href={dataUrl}
        download={`qrcode-${slug}.png`}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 font-semibold text-[var(--primary-foreground)] text-sm transition-colors hover:opacity-90"
      >
        Baixar QR Code
      </a>
    </Card>
  );
}
