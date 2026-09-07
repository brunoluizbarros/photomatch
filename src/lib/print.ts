// ponytail: originais em resolução cheia, todos rasterizados de uma vez no
// preview de /admin/events/[id]/print — mais que isso trava o browser. Add
// thumbnails de impressão gerados no worker se esse teto virar problema real.
//
// Compartilhado entre a página de impressão (server) e o painel da fila de
// impressão (client) — nunca importe um do outro (puxaria módulos de
// servidor pro bundle do cliente).
export const MAX_PRINT_PHOTOS = 30;

// Tamanhos físicos oferecidos na fila de impressão (ver
// src/lib/db/schemas/orders.ts:printSizeEnum) — mesma lista em todo lugar
// que precisa exibir/escolher tamanho (painel da fila, aqui).
export const PRINT_SIZES = [
  { value: '5x7', label: '5x7' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: '10x15', label: '10x15' },
  { value: '15x20', label: '15x20' },
] as const;

export type PrintSize = (typeof PRINT_SIZES)[number]['value'];
