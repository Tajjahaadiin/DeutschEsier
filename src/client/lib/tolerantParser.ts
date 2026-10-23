/**
 * Parser toleran generik untuk membaca payload JSON array dari kolom database.
 *
 * Menerapkan aturan aman:
 * 1. String kosong/null/undefined -> menghasilkan array kosong [] tanpa melempar error.
 * 2. Format JSON tidak valid -> ditangkap try/catch, fallback ke [].
 * 3. Payload bukan array -> fallback ke [].
 * 4. Memvalidasi setiap entri dengan fungsi validator; entri cacat yang mengembalikan
 *    null dibuang tanpa menggagalkan entri valid lainnya.
 */
export function parseTolerantArray<T>(
  raw: string | null | undefined,
  validateEntry: (entry: unknown, index: number) => T | null
): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry, idx) => validateEntry(entry, idx))
      .filter((item): item is T => item !== null)
  } catch {
    return []
  }
}
