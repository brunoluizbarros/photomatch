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

// Só aceita caminho interno começando com uma única "/" — bloqueia
// "https://evil.com" e "//evil.com" (protocol-relative), que um atacante
// poderia colocar em ?callbackUrl= pra usar o login legítimo como trampolim
// pra um site malicioso (open redirect).
function safeCallbackUrl(value: string | null): string {
  if (value?.startsWith('/') && !value.startsWith('//')) return value;
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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Card className="space-y-4">
        <h1 className="font-bold text-xl">Entrar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
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
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
