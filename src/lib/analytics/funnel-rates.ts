// Extraída de src/actions/analytics.ts: um arquivo 'use server' só pode
// exportar funções async (Server Actions), então essa função pura pura vive
// aqui — mesmo padrão de dedupeAndOrderMatches em src/lib/photo-search.ts.
export function funnelRates(r: { visits: number; searches: number; found: number }) {
  return {
    searchRate: r.visits ? r.searches / r.visits : 0,
    successRate: r.searches ? r.found / r.searches : 0,
  };
}
