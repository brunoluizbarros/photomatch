'use client';

import { type CartItemInput, createOrder } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Quote } from '@/lib/pricing';
import { type FormEvent, useState } from 'react';

function centsToBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CheckoutDialog({
  open,
  slug,
  items,
  quote,
  onClose,
  onDone,
}: {
  open: boolean;
  slug: string;
  items: CartItemInput[];
  quote: Quote;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderUrl, setOrderUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createOrder(slug, items, { name, email, phone, marketingOptIn });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrderUrl(`${window.location.origin}/pedido/${result.token}`);
  }

  function handleClose() {
    setName('');
    setEmail('');
    setPhone('');
    setMarketingOptIn(false);
    setError(null);
    const wasDone = orderUrl !== null;
    setOrderUrl(null);
    onClose();
    if (wasDone) onDone();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Finalizar pedido">
      {orderUrl ? (
        <div className="space-y-4 text-center">
          <p className="text-sm">
            Pedido feito! Acompanhe o pagamento e baixe suas fotos por este link — guarde-o:
          </p>
          <p className="break-all rounded-lg border border-[var(--border)] p-3 text-sm">
            <a href={orderUrl} target="_blank" rel="noreferrer" className="underline">
              {orderUrl}
            </a>
          </p>
          <Button variant="accent" className="w-full" onClick={handleClose}>
            Concluir
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-semibold text-lg">{centsToBRL(quote.totalCents)}</p>
          <div className="space-y-1">
            <Label htmlFor="checkout-name">Nome</Label>
            <Input
              id="checkout-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="checkout-email">E-mail</Label>
            <Input
              id="checkout-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="checkout-phone">Telefone</Label>
            <Input
              id="checkout-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Label
            htmlFor="checkout-opt-in"
            className="flex cursor-pointer items-start gap-2 text-sm"
          >
            <Checkbox
              id="checkout-opt-in"
              checked={marketingOptIn}
              onCheckedChange={(v) => setMarketingOptIn(!!v)}
            />
            Quero receber novidades e mensagens deste evento.
          </Label>
          {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
          <Button type="submit" variant="accent" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : 'Confirmar pedido'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
