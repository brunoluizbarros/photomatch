export function slugify(name: string) {
  return (
    name
      .normalize('NFD')
      // Remove marcas diacríticas (acentos) isoladas pelo NFD acima.
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}
