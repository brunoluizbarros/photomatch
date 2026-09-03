'use client';

import { requestBrandingImageUpload } from '@/actions/branding';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';

// Campo de imagem com upload + preview — usado pra capa e logo do álbum.
// Sobe o arquivo assim que é escolhido (presign + PUT direto no bucket,
// mesmo padrão do BulkUploader) e já mostra o preview local via blob URL,
// sem esperar o "Salvar personalização"; só o storageKey resultante entra
// no submit do formulário.
export function ImageUploadField({
  label,
  hint,
  albumId,
  kind,
  initialPreviewUrl,
  value,
  onChange,
  aspect = 'wide',
}: {
  label: string;
  hint?: string;
  albumId: string;
  kind: 'hero' | 'logo';
  initialPreviewUrl: string | null;
  value: string | null;
  onChange: (storageKey: string | null) => void;
  aspect?: 'wide' | 'square';
}) {
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const { storageKey, uploadUrl } = await requestBrandingImageUpload({
        albumId,
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
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className={cn(
              'rounded-md border border-[var(--border)] bg-[var(--muted)] object-cover',
              aspect === 'wide' ? 'h-16 w-28' : 'h-16 w-16',
            )}
          />
        ) : (
          <div
            className={cn(
              'grid place-items-center rounded-md border border-[var(--border)] border-dashed text-[var(--muted-foreground)]',
              aspect === 'wide' ? 'h-16 w-28' : 'h-16 w-16',
            )}
          >
            <ImagePlus className="size-5" />
          </div>
        )}
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
          {value && !uploading && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                onChange(null);
              }}
              className="block text-[var(--muted-foreground)] text-xs underline"
            >
              Remover
            </button>
          )}
        </div>
      </div>
      {hint && !error && <p className="text-[var(--muted-foreground)] text-xs">{hint}</p>}
      {error && <p className="text-[var(--destructive)] text-xs">{error}</p>}
    </div>
  );
}
