'use client';

import { BulkUploader } from '@/components/admin/bulk-uploader';
import { ImportFromLink } from '@/components/admin/import-from-link';
import { DropboxIcon, GoogleDriveIcon } from '@/components/icons/brand-icons';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { Upload } from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';

type Tab = 'upload' | 'drive' | 'dropbox';
type TabIcon = ComponentType<{ className?: string }>;

const TABS: { id: Tab; label: string; icon: TabIcon; description: string }[] = [
  {
    id: 'upload',
    label: 'Enviar fotos',
    icon: Upload,
    description: 'Selecione as fotos direto do seu computador.',
  },
  {
    id: 'drive',
    label: 'Google Drive',
    icon: GoogleDriveIcon,
    description:
      'Link público de um arquivo ou pasta do Google Drive. A pasta precisa estar compartilhada como "qualquer pessoa com o link".',
  },
  {
    id: 'dropbox',
    label: 'Dropbox',
    icon: DropboxIcon,
    description:
      'Link público de um arquivo do Dropbox — links de pasta não são suportados sem login.',
  },
];

// Um único card pra adicionar fotos, com abas pra escolher a origem — upload
// direto ou link do Drive/Dropbox — em vez de dois cards separados.
export function AddPhotosPanel({ albumId, onDone }: { albumId: string; onDone: () => void }) {
  const [tab, setTab] = useState<Tab>('upload');
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <Card className="space-y-4">
      <h2 className="font-display uppercase">Adicionar fotos</h2>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              tab === t.id
                ? 'border-[var(--foreground)] bg-[var(--background)]'
                : 'border-[var(--border)] hover:border-[var(--foreground)]/40',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-[var(--muted-foreground)] text-sm">{active.description}</p>

      {tab === 'upload' && <BulkUploader albumId={albumId} onDone={onDone} />}
      {tab === 'drive' && <ImportFromLink albumId={albumId} provider="drive" onDone={onDone} />}
      {tab === 'dropbox' && <ImportFromLink albumId={albumId} provider="dropbox" onDone={onDone} />}
    </Card>
  );
}
