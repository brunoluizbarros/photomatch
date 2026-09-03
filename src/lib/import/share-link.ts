// Resolve um link público de compartilhamento (Google Drive ou Dropbox) numa
// lista de imagens baixáveis, sem OAuth — o admin só cola o link.
export type RemoteImage = { filename: string; url: string };
export type ShareProvider = 'drive' | 'dropbox';

const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);
const DROPBOX_HOSTS = new Set(['dropbox.com', 'www.dropbox.com']);

// Detecta o provedor pelo host do link — única fonte de verdade, usada tanto
// aqui quanto na validação client-side do seletor Drive/Dropbox no admin.
export function detectShareProvider(rawUrl: string): ShareProvider | null {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    if (DRIVE_HOSTS.has(host)) return 'drive';
    if (DROPBOX_HOSTS.has(host)) return 'dropbox';
    return null;
  } catch {
    return null;
  }
}

function driveDownloadUrl(fileId: string): string {
  // ?confirm=t evita a interstitial de "verificar vírus" em arquivos maiores —
  // é o mesmo parâmetro que o próprio formulário da interstitial envia.
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

// Listagem de pasta pública sem API key: embeddedfolderview é um endpoint não
// documentado (herança do Google Sites clássico), mas estável há anos. Só
// extrai IDs via regex — não depende da estrutura do HTML, só do padrão de
// URL /file/d/{id} que ele sempre imprime.
// ponytail: se esse endpoint sair do ar, o fallback documentado é a Drive API
// v3 (`GET https://www.googleapis.com/drive/v3/files?q='{id}'+in+parents&key={GOOGLE_API_KEY}`),
// que exige criar uma API key no GCP e uma env var nova.
async function listDriveFolder(folderId: string): Promise<RemoteImage[]> {
  const response = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`);
  const html = await response.text();
  const ids = [...new Set([...html.matchAll(/\/file\/d\/([\w-]{20,})/g)].map((m) => m[1]))];
  if (ids.length === 0) {
    throw new Error(
      'Nenhuma foto encontrada. Confira se a pasta está compartilhada como "qualquer pessoa com o link".',
    );
  }
  // O nome é só cosmético (storageKey final usa cuid2); extensão real sai do
  // magic-bytes check no download.
  return ids.map((id) => ({ filename: `${id}.jpg`, url: driveDownloadUrl(id) }));
}

function parseDriveUrl(url: URL): { type: 'file' | 'folder'; id: string } | null {
  const fileMatch = url.pathname.match(/\/file\/d\/([\w-]+)/);
  if (fileMatch) return { type: 'file', id: fileMatch[1] };

  const folderMatch = url.pathname.match(/\/folders\/([\w-]+)/);
  if (folderMatch) return { type: 'folder', id: folderMatch[1] };

  const idParam = url.searchParams.get('id');
  if (idParam) return { type: 'file', id: idParam };

  return null;
}

function resolveDropboxUrl(url: URL): RemoteImage {
  // /scl/fo/ ou /sh/ = pasta — sem token, o Dropbox só entrega pasta como
  // .zip (?dl=1 num link de pasta baixa o zip inteiro). Suportar isso exigiria
  // uma lib de unzip e uma forma de expandir 1 URL em N fotos, fora do escopo
  // desta v1 — a mensagem de erro explica a alternativa (baixar o zip e usar
  // "Selecionar fotos", que já aguenta centenas de arquivos).
  if (url.pathname.includes('/scl/fo/') || url.pathname.includes('/sh/')) {
    throw new Error(
      'Links de pasta do Dropbox não são suportados sem login — o Dropbox só entrega como .zip. Baixe o .zip, descompacte e use "Selecionar fotos", ou compartilhe a pasta pelo Google Drive.',
    );
  }
  // rlkey é o que dá acesso no link /scl/fi/ — nunca removê-lo.
  url.searchParams.set('dl', '1');
  const filename = decodeURIComponent(url.pathname.split('/').pop() || 'foto.jpg');
  return { filename, url: url.toString() };
}

export async function resolveShareLink(rawUrl: string): Promise<RemoteImage[]> {
  const url = new URL(rawUrl);
  const provider = detectShareProvider(rawUrl);

  if (provider === 'drive') {
    const parsed = parseDriveUrl(url);
    if (!parsed) throw new Error('Não reconheci esse link do Google Drive.');
    return parsed.type === 'folder'
      ? listDriveFolder(parsed.id)
      : [{ filename: `${parsed.id}.jpg`, url: driveDownloadUrl(parsed.id) }];
  }

  if (provider === 'dropbox') {
    return [resolveDropboxUrl(url)];
  }

  throw new Error('Link não suportado — use um link do Google Drive ou do Dropbox.');
}
