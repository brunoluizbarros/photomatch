'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useState } from 'react';

// Espera cada <img> terminar de DECODIFICAR (não só carregar) antes de abrir
// o diálogo de impressão — window.print() não espera imagem nenhuma, e sem
// isso o Chrome abre o diálogo com fotos ainda em voo saindo em branco.
// img.decode() é a garantia que `onload` não dá.
async function waitForImages() {
  const images = [...document.querySelectorAll('img')];
  await Promise.all(
    images.map((img) =>
      img.complete
        ? img.decode().catch(() => {})
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
}

export function PrintPhotos({ photos }: { photos: { id: string; url: string }[] }) {
  const [preparing, setPreparing] = useState(false);

  async function handlePrint() {
    setPreparing(true);
    await waitForImages();
    setPreparing(false);
    window.print();
  }

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-[var(--muted-foreground)] text-sm">{photos.length} foto(s)</p>
        <Button onClick={handlePrint} disabled={preparing}>
          <Printer className="size-4" />
          {preparing ? 'Preparando...' : 'Imprimir'}
        </Button>
      </div>

      {photos.map((photo) => (
        <div key={photo.id} className="print-sheet">
          {/* <img> puro, não next/image: unoptimized no next.config já não
              agrega nada, e o modo fill usa position:absolute com alturas em
              vh/svh — não confiáveis no contexto de impressão. */}
          <img src={photo.url} alt="" />
        </div>
      ))}
    </div>
  );
}
