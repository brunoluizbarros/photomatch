// Escapa texto antes de interpolar em HTML de e-mail — os pedidos de acesso
// vêm de um formulário público, sem login; sem isso, alguém digitando
// `<script>`/`<img onerror=...>` no nome ou telefone entraria cru no e-mail
// que o admin abre no cliente de e-mail dele.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
