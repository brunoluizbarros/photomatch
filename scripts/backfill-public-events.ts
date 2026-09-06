// Backfill de compatibilidade pra quando o token de acesso (access_requests.
// token) passou a existir: antes disso, "aprovar" um pedido só revelava o
// link puro /e/[slug] (sem token, sem controle técnico real — qualquer um
// com a URL entrava). Convidados já aprovados por e-mail/WhatsApp antes desse
// deploy têm esse link antigo salvo, sem token nenhum.
//
// Sem este backfill, todo evento nasce privado (events.isPublic default
// false) e passaria a exigir token em /e/[slug] — quebrando o acesso de quem
// já tinha o link antigo. Este script marca como público qualquer evento que
// já teve pelo menos um pedido aprovado: na prática já funcionava como
// público (link livre, sem token), então só estamos tornando isso explícito.
//
// Rodar uma vez logo após o deploy desta migration:
// pnpm backfill-public-events
import 'dotenv/config';

async function main() {
  const { db } = await import('../src/lib/db/client');
  const { events, access_requests } = await import('../src/lib/db/schemas');
  const { eq, inArray } = await import('drizzle-orm');

  const approved = await db
    .selectDistinct({ eventId: access_requests.eventId })
    .from(access_requests)
    .where(eq(access_requests.status, 'approved'));
  const eventIds = approved.map((row) => row.eventId);

  if (eventIds.length === 0) {
    console.info('Nenhum evento com pedido de acesso aprovado.');
    process.exit(0);
  }

  await db.update(events).set({ isPublic: true }).where(inArray(events.id, eventIds));
  console.info(`${eventIds.length} evento(s) marcado(s) como público (já tinham acesso aprovado).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha no backfill de eventos públicos', err);
  process.exit(1);
});
