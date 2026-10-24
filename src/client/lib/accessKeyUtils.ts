/**
 * Helper untuk menyusun tautan murid berdasar tipe sesi (dialog skenario atau modul Grundlagen).
 */
export function buildStudentShareUrl(origin: string, sessionId: string, key: string): string {
  const cleanKey = encodeURIComponent(key.trim().toUpperCase())
  if (sessionId === 'grundlagen') {
    return `${origin}/grundlagen?key=${cleanKey}`
  }
  return `${origin}/view/${sessionId}?key=${cleanKey}`
}
