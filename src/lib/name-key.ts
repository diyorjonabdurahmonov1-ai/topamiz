// Two profile names count as the same name when they differ only in case,
// spacing or which apostrophe was typed — Uzbek has four in common use
// (o' o‘ oʻ o’), and "Aziz  Karimov" shouldn't get past "aziz karimov".
// Kept free of imports: the database migration uses it too.
export function nameKey(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ʻʼ‘’`´ʹ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
