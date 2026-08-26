import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-bold text-3xl">PhotoMatch</h1>
      <p className="text-[var(--muted-foreground)]">
        Encontre suas fotos de evento tirando uma selfie. Peça o link do seu evento a quem
        organizou.
      </p>
      <Button asChild>
        <Link href="/admin">Entrar como organizador</Link>
      </Button>
    </div>
  );
}
