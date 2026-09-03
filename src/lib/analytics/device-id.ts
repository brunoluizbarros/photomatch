const KEY = 'pm_did';
let memoryId: string | undefined;

// UUID anônimo por navegador, guardado em localStorage — identifica um
// dispositivo, nunca uma pessoa. crypto.randomUUID é nativo, não precisa de
// cuid2 no bundle público.
export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // ponytail: storage bloqueado (Safari privado/ITP) → id só na memória da
    // aba. Conta como pessoa nova a cada aba, mas visita e busca da mesma
    // sessão continuam batendo. Melhor que colapsar todo mundo num id fixo.
    memoryId ??= crypto.randomUUID();
    return memoryId;
  }
}
