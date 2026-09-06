import { db } from '@/lib/db/client';
import { orders } from '@/lib/db/schemas';
import { eq } from 'drizzle-orm';

// Fronteira inteira do gateway de pagamento: hoje só a action de admin chama
// isso (src/actions/sales.ts:markOrderPaid), depois de um requireAdmin(). No
// dia que existir um gateway de verdade, um webhook em
// src/app/api/webhooks/<gateway>/route.ts chama a mesmíssima função depois de
// validar a assinatura do payload — nada mais muda. Sem auth aqui dentro: é
// responsabilidade de quem chama.
export async function markOrderPaid(orderId: string, paidBy: string | null) {
  const [order] = await db
    .update(orders)
    .set({ status: 'paid', paidAt: new Date(), paidBy })
    .where(eq(orders.id, orderId))
    .returning();
  return order ?? null;
}
