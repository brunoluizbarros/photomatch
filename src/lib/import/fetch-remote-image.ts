// Busca uma imagem de uma URL de terceiro (Drive/Dropbox) com proteção
// SSRF-adjacent: os hosts são fixos (Drive/Dropbox + seus CDNs), mas um
// redirect malicioso poderia escapar da allowlist se seguido sem checagem.
const ALLOWED_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
  'drive.usercontent.google.com',
  'dropbox.com',
  'www.dropbox.com',
]);
// Drive e Dropbox redirecionam pro CDN deles nesses sufixos.
const ALLOWED_SUFFIXES = ['.googleusercontent.com', '.dropboxusercontent.com'];
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function assertAllowed(url: URL) {
  if (url.protocol !== 'https:') throw new Error(`Protocolo não permitido: ${url.protocol}`);
  const host = url.hostname.toLowerCase();
  const ok = ALLOWED_HOSTS.has(host) || ALLOWED_SUFFIXES.some((s) => host.endsWith(s));
  if (!ok) throw new Error(`Host não permitido: ${host}`);
}

export async function fetchRemoteImage(rawUrl: string): Promise<{
  body: Buffer;
  contentType: 'image/jpeg' | 'image/png';
}> {
  let url = new URL(rawUrl);
  let response: Response | null = null;

  // redirect: 'manual' porque cada salto precisa passar pela allowlist — com
  // 'follow' um 302 malicioso sairia dela sem ninguém ver.
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertAllowed(url);
    response = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'photomatch-import' },
    });
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    break;
  }
  if (!response?.ok) throw new Error(`Origem respondeu ${response?.status ?? 'nada'}`);

  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) throw new Error(`Imagem acima do limite de ${MAX_BYTES} bytes`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Resposta sem corpo');
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    // Content-length pode vir ausente ou mentindo — o teto real é este.
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('Imagem acima do limite de 25MB');
    }
    chunks.push(Buffer.from(value));
  }
  const body = Buffer.concat(chunks);

  // Content-type não serve de prova: o Dropbox manda application/octet-stream
  // no dl=1 e o Drive manda text/html quando o arquivo não é público. Magic
  // bytes decidem — e o Rekognition só aceita JPEG/PNG mesmo.
  const isJpeg = body[0] === 0xff && body[1] === 0xd8;
  const isPng = body.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (!isJpeg && !isPng) {
    throw new Error('Origem não devolveu um JPEG/PNG (arquivo não é público, ou é HEIC/vídeo)');
  }

  return { body, contentType: isJpeg ? 'image/jpeg' : 'image/png' };
}
