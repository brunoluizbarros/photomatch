import { getOrderByToken } from '@/actions/orders';
import { OrderView } from '@/components/public/order-view';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// Link de posse do pedido — nunca deve ser indexado nem seguido.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getOrderByToken(token);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <p className="text-[var(--muted-foreground)] text-sm">{result.error}</p>
      </div>
    );
  }

  return <OrderView token={token} order={result.order} items={result.items} />;
}
