'use client';

import { confirmPhotoUploaded, requestPhotoUpload } from '@/actions/photos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEffect, useRef, useState } from 'react';

const CONCURRENCY = 4;
const MAX_ATTEMPTS_PER_FILE = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const runners = Array.from({ length: limit }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) await worker(item);
    }
  });
  await Promise.all(runners);
}

export function BulkUploader({ albumId, onDone }: { albumId: string; onDone: () => void }) {
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploading) return;
    // ponytail: fechar a aba durante o upload perde o progresso — sem retomada
    // entre sessões. Aceitável para lotes de até algumas centenas de fotos.
    function handler(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploading]);

  async function uploadOneAttempt(file: File) {
    const { photoId, uploadUrl } = await requestPhotoUpload({
      albumId,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
    });
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    await confirmPhotoUploaded(photoId);
  }

  async function uploadWithRetry(file: File) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_FILE; attempt++) {
      try {
        await uploadOneAttempt(file);
        setDone((d) => d + 1);
        return;
      } catch {
        if (attempt === MAX_ATTEMPTS_PER_FILE) {
          setFailedFiles((f) => [...f, file]);
          return;
        }
        await sleep(attempt * 1000);
      }
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setTotal((t) => t + list.length);
    setFailedFiles([]);
    setUploading(true);
    await runWithConcurrency(list, CONCURRENCY, uploadWithRetry);
    setUploading(false);
    onDone();
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Enviar fotos</h2>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? 'Enviando...' : 'Selecionar fotos'}
      </Button>

      {total > 0 && (
        <div className="space-y-1">
          <Progress value={(done / total) * 100} />
          <p className="text-[var(--muted-foreground)] text-sm">
            {done} de {total} enviadas
          </p>
        </div>
      )}

      {failedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[var(--destructive)] text-sm">
            {failedFiles.length} arquivo(s) falharam ao enviar.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const retry = failedFiles;
              setFailedFiles([]);
              setUploading(true);
              await runWithConcurrency(retry, CONCURRENCY, uploadWithRetry);
              setUploading(false);
              onDone();
            }}
          >
            Tentar de novo
          </Button>
        </div>
      )}
    </Card>
  );
}
