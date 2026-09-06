// ponytail: originais em resolução cheia, todos rasterizados de uma vez no
// preview de /admin/events/[id]/print — mais que isso trava o browser. Add
// thumbnails de impressão gerados no worker se esse teto virar problema real.
//
// Compartilhado entre a página de impressão (server) e o painel da fila de
// impressão (client) — nunca importe um do outro (puxaria módulos de
// servidor pro bundle do cliente).
export const MAX_PRINT_PHOTOS = 30;
