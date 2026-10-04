import type { NumberObject } from '../lib/numberGame'

/**
 * Bank benda untuk game "die Nummer".
 *
 * Gambar memakai emoji: proyek ini tidak punya pipeline aset gambar, dan emoji
 * langsung tampil tanpa file tambahan. Setiap benda menyimpan artikel dan
 * bentuk jamak karena mesin kombinasi membutuhkannya untuk memilih bentuk yang
 * benar (eine Tomate / zwei Tomaten).
 */
export interface ObjectItem extends NumberObject {
  /** Kelompok tema, untuk pengelompokan di UI. */
  category: string
}

export const OBJECT_ITEMS: ObjectItem[] = [
  // Makanan & Minuman
  { noun: 'Tomate', article: 'die', plural: 'Tomaten', emoji: '🍅', meaningId: 'tomat', category: 'Makanan' },
  { noun: 'Apfel', article: 'der', plural: 'Äpfel', emoji: '🍎', meaningId: 'apel', category: 'Makanan' },
  { noun: 'Banane', article: 'die', plural: 'Bananen', emoji: '🍌', meaningId: 'pisang', category: 'Makanan' },
  { noun: 'Orange', article: 'die', plural: 'Orangen', emoji: '🍊', meaningId: 'jeruk', category: 'Makanan' },
  { noun: 'Brot', article: 'das', plural: 'Brote', emoji: '🍞', meaningId: 'roti', category: 'Makanan' },
  { noun: 'Ei', article: 'das', plural: 'Eier', emoji: '🥚', meaningId: 'telur', category: 'Makanan' },
  { noun: 'Kartoffel', article: 'die', plural: 'Kartoffeln', emoji: '🥔', meaningId: 'kentang', category: 'Makanan' },
  { noun: 'Käse', article: 'der', plural: 'Käse', emoji: '🧀', meaningId: 'keju', category: 'Makanan' },
  { noun: 'Zitrone', article: 'die', plural: 'Zitronen', emoji: '🍋', meaningId: 'lemon', category: 'Makanan' },
  { noun: 'Karotte', article: 'die', plural: 'Karotten', emoji: '🥕', meaningId: 'wortel', category: 'Makanan' },
  { noun: 'Kuchen', article: 'der', plural: 'Kuchen', emoji: '🍰', meaningId: 'kue', category: 'Makanan' },
  { noun: 'Wasser', article: 'das', plural: 'Wasser', emoji: '💧', meaningId: 'air', category: 'Minuman' },

  // Benda & Rumah
  { noun: 'Glas', article: 'das', plural: 'Gläser', emoji: '🥛', meaningId: 'gelas', category: 'Rumah' },
  { noun: 'Tasse', article: 'die', plural: 'Tassen', emoji: '☕', meaningId: 'cangkir', category: 'Rumah' },
  { noun: 'Teller', article: 'der', plural: 'Teller', emoji: '🍽️', meaningId: 'piring', category: 'Rumah' },
  { noun: 'Flasche', article: 'die', plural: 'Flaschen', emoji: '🍾', meaningId: 'botol', category: 'Rumah' },
  { noun: 'Buch', article: 'das', plural: 'Bücher', emoji: '📕', meaningId: 'buku', category: 'Rumah' },
  { noun: 'Stuhl', article: 'der', plural: 'Stühle', emoji: '🪑', meaningId: 'kursi', category: 'Rumah' },
  { noun: 'Lampe', article: 'die', plural: 'Lampen', emoji: '💡', meaningId: 'lampu', category: 'Rumah' },
  { noun: 'Schlüssel', article: 'der', plural: 'Schlüssel', emoji: '🔑', meaningId: 'kunci', category: 'Rumah' },

  // Sekolah & Lainnya
  { noun: 'Stift', article: 'der', plural: 'Stifte', emoji: '✏️', meaningId: 'pulpen', category: 'Sekolah' },
  { noun: 'Heft', article: 'das', plural: 'Hefte', emoji: '📓', meaningId: 'buku tulis', category: 'Sekolah' },
  { noun: 'Blume', article: 'die', plural: 'Blumen', emoji: '🌸', meaningId: 'bunga', category: 'Alam' },
  { noun: 'Ball', article: 'der', plural: 'Bälle', emoji: '⚽', meaningId: 'bola', category: 'Lainnya' },
]

/** Daftar kategori unik, urut sesuai kemunculan. */
export const OBJECT_CATEGORIES: string[] = [
  ...new Set(OBJECT_ITEMS.map((o) => o.category)),
]
