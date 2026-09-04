'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth/client';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useState } from 'react';

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

// Resolve contra o próprio parser de URL do navegador (o mesmo que vai
// navegar de verdade) em vez de checar prefixo de string — um prefixo
// manual como startsWith('/') passa para "/\evil.com", que o navegador
// normaliza pra "//evil.com" (protocol-relative) e navega pra fora do
// site. Comparar a origin resultante cobre isso e também bloqueia
// esquemas como "javascript:".
function safeCallbackUrl(value: string | null): string {
  if (!value) return '/admin';
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin) return url.pathname + url.search + url.hash;
  } catch {
    // valor não é uma URL válida — cai no fallback
  }
  return '/admin';
}

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({ email, password });
    setLoading(false);

    if (signInError) {
      setError('E-mail ou senha inválidos.');
      return;
    }

    // Hard navigation: router.push reaproveita o Router Cache do Next, que já
    // guardou o redirect do middleware pra /auth/sign-in de antes do login —
    // só um reload completo força o middleware a reler o cookie novo.
    window.location.href = safeCallbackUrl(searchParams.get('callbackUrl'));
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[var(--primary)] to-[var(--primary-dark)] px-4">
      <p className="mb-6 font-display text-lg text-white uppercase">
        PhotoMatch <span className="text-[var(--accent-light)]">admin</span>
      </p>
      <Card className="w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl text-[var(--foreground)] uppercase">Entrar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
          <Button type="submit" variant="accent" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
