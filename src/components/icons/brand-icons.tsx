// Marcas simplificadas do Google Drive e Dropbox pro seletor de provedor do
// importador de link — geometria própria (não é o path oficial da marca),
// só o suficiente pra ficar reconhecível ao lado do nome do serviço.
import { useId } from 'react';

export function GoogleDriveIcon({ className }: { className?: string }) {
  const titleId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-labelledby={titleId}>
      <title id={titleId}>Google Drive</title>
      <path d="M12 3L3 20L12 14.33Z" fill="#0066da" />
      <path d="M3 20L21 20L12 14.33Z" fill="#00ac47" />
      <path d="M12 3L21 20L12 14.33Z" fill="#ffba00" />
    </svg>
  );
}

export function DropboxIcon({ className }: { className?: string }) {
  const titleId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-labelledby={titleId}>
      <title id={titleId}>Dropbox</title>
      <polygon points="12,3 21,8 12,13 3,8" fill="#0061ff" />
      <polygon points="12,11 18,15 12,19 6,15" fill="#0061ff" />
    </svg>
  );
}
