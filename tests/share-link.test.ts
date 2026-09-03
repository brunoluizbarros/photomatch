import { resolveShareLink } from '@/lib/import/share-link';
import { describe, expect, it, vi } from 'vitest';

describe('resolveShareLink', () => {
  it('resolves a Google Drive single-file link', async () => {
    const images = await resolveShareLink(
      'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrSt/view?usp=sharing',
    );
    expect(images).toEqual([
      {
        filename: '1AbCdEfGhIjKlMnOpQrSt.jpg',
        url: 'https://drive.usercontent.google.com/download?id=1AbCdEfGhIjKlMnOpQrSt&export=download&confirm=t',
      },
    ]);
  });

  it('resolves a Google Drive open?id= link', async () => {
    const images = await resolveShareLink('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrSt');
    expect(images[0].url).toContain('id=1AbCdEfGhIjKlMnOpQrSt');
  });

  it('resolves a Google Drive folder link by scraping file ids', async () => {
    const html = `
      <a href="/file/d/1FolderFileAAAAAAAAAAAA/view">a.jpg</a>
      <a href="/file/d/1FolderFileBBBBBBBBBBBB/view">b.jpg</a>
      <a href="/file/d/1FolderFileAAAAAAAAAAAA/view">dup</a>
    `;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(html)),
    );
    try {
      const images = await resolveShareLink('https://drive.google.com/drive/folders/1FolderIdXYZ');
      expect(images).toHaveLength(2);
      expect(images.map((i) => i.filename)).toEqual([
        '1FolderFileAAAAAAAAAAAA.jpg',
        '1FolderFileBBBBBBBBBBBB.jpg',
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('resolves a Dropbox single-file link, forcing dl=1 and keeping rlkey', async () => {
    const images = await resolveShareLink(
      'https://www.dropbox.com/scl/fi/abc123/foto.jpg?rlkey=xyz789&dl=0',
    );
    expect(images).toEqual([
      {
        filename: 'foto.jpg',
        url: 'https://www.dropbox.com/scl/fi/abc123/foto.jpg?rlkey=xyz789&dl=1',
      },
    ]);
  });

  it('rejects a Dropbox folder link with an explanatory message', async () => {
    await expect(
      resolveShareLink('https://www.dropbox.com/scl/fo/xyz/h?rlkey=abc'),
    ).rejects.toThrow(/pasta/i);
  });

  it('rejects a host that is not Drive or Dropbox', async () => {
    await expect(resolveShareLink('https://evil.example.com/file.jpg')).rejects.toThrow(
      /não suportado/i,
    );
  });
});
