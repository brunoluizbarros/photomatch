// ponytail: só cobre número brasileiro (produto é 100% pt-BR hoje). Se
// precisar de outro país, pedir o DDI explícito no formulário.
export function toE164BR(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55'))
    return `+${digits}`;
  return null;
}
