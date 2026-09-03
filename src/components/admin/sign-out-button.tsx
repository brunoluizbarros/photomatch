'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={async () => {
        await authClient.signOut();
        router.push('/auth/sign-in');
      }}
    >
      Sair
    </Button>
  );
}
