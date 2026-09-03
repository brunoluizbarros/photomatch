'use client';

import { testRekognitionSearch } from '@/actions/rekognition-test';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRef, useState } from 'react';

type Match = Awaited<ReturnType<typeof testRekognitionSearch>>[number];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ThresholdTestPanel({ eventId }: { eventId: string }) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      setMatches(await testRekognitionSearch(eventId, base64));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? 'Buscando...' : 'Subir selfie de teste'}
      </Button>
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
      {matches && (
        <ul className="space-y-1">
          {matches.map((match) => (
            <li key={match.photoId} className="flex items-center justify-between text-sm">
              <span>{match.photoId}</span>
              <span className="flex items-center gap-2">
                {match.similarity.toFixed(1)}%
                <Badge variant={match.passesThreshold ? 'success' : 'destructive'}>
                  {match.passesThreshold ? '✅ passa' : '❌ fora'}
                </Badge>
              </span>
            </li>
          ))}
          {matches.length === 0 && (
            <p className="text-[var(--muted-foreground)] text-sm">Nenhum rosto encontrado.</p>
          )}
        </ul>
      )}
    </Card>
  );
}
