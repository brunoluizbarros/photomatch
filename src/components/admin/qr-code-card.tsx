'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

// QR code da página pública do álbum, gerado no navegador (a URL depende do
// domínio de quem está acessando o admin) — pronto pra imprimir/divulgar no
// evento.
export function QrCodeCard({ slug }: { slug: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    const url = `${window.location.origin}/e/${slug}`;
    setPublicUrl(url);
    QRCode.toDataURL(url, { width: 480, margin: 2 }).then(setDataUrl);
  }, [slug]);

  // Safari e várias webviews de Android ignoram o atributo `download` em
  // links `data:` — abrem a imagem em vez de salvar. Um Blob URL baixa como
  // arquivo de verdade em todos os navegadores.
  useEffect(() => {
    if (!dataUrl) return;
    let url: string | undefined;
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [dataUrl]);

  if (!dataUrl) return null;

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <h2 className="self-start font-display uppercase">QR Code</h2>
      <img src={dataUrl} alt="QR code da página pública do álbum" className="size-40 rounded-lg" />
      <p className="break-all text-[var(--muted-foreground)] text-xs">{publicUrl}</p>
      <Button asChild>
        <a href={blobUrl ?? dataUrl} download={`qrcode-${slug}.png`}>
          Baixar QR Code
        </a>
      </Button>
    </Card>
  );
}
