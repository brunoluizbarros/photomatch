'use client';

import { requestBrandingImageUpload } from '@/actions/branding';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';

// Campo de imagem com upload + preview — usado pra capa e logo do evento.
// Sobe o arquivo assim que é escolhido (presign + PUT direto no bucket,
// mesmo padrão do BulkUploader) e já mostra o preview local via blob URL,
// sem esperar o "Salvar personalização"; só o storageKey resultante entra
// no submit do formulário.
export function ImageUploadField({
  label,
  hint,
  eventId,
  kind,
  initialPreviewUrl,
  value,
  onChange,
  aspect = 'wide',
}: {
  label: string;
  hint?: string;
  eventId: string;
  kind: 'hero' | 'logo';
  initialPreviewUrl: string | null;
  value: string | null;
  onChange: (storageKey: string | null) => void;
  aspect?: 'wide' | 'square';
}) {
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Uma classe só de tamanho, usada tanto no estado vazio quanto no
  // preenchido — a caixa nunca muda de tamanho ao trocar de estado.
  const boxSize = aspect === 'wide' ? 'h-16 w-28' : 'h-16 w-16';

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const { storageKey, uploadUrl } = await requestBrandingImageUpload({
        eventId,
        kind,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
      });
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      onChange(storageKey);
    } catch {
      setError('Não foi possível enviar a imagem. Tente de novo.');
      setPreviewUrl(initialPreviewUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex items-center gap-3">
        <div className={cn('relative shrink-0', boxSize)}>
          {previewUrl ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              aria-label={`Ver ${label} em tamanho maior`}
              className="block h-full w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]"
            >
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <div className="grid h-full w-full place-items-center rounded-md border border-[var(--border)] border-dashed text-[var(--muted-foreground)]">
              <ImagePlus className="size-5" />
            </div>
          )}
          {value && !uploading && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                onChange(null);
              }}
              aria-label={`Remover ${label}`}
              className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-[var(--destructive)] text-white shadow"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : previewUrl ? 'Trocar imagem' : 'Selecionar imagem'}
          </Button>
        </div>
      </div>
      {hint && !error && <p className="text-[var(--muted-foreground)] text-xs">{hint}</p>}
      {error && <p className="text-[var(--destructive)] text-xs">{error}</p>}

      {previewUrl && (
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={label}>
          <img src={previewUrl} alt="" className="mx-auto max-h-[70vh] w-full object-contain" />
        </Dialog>
      )}
    </div>
  );
}
