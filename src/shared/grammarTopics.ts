/**
 * Taksonomi topik tata bahasa Jerman level B1.
 *
 * Satu sumber kebenaran yang dipakai klien (dropdown generator) dan server
 * (validasi + instruksi prompt). ID sengaja ASCII dan stabil agar aman disimpan
 * di JSON dan tidak berubah saat label diterjemahkan.
 *
 * ATURAN IMPORT: klien boleh memakai alias `@/shared/grammarTopics`, tetapi
 * kode server dan test WAJIB memakai jalur relatif (`../../shared/grammarTopics`).
 * Penyebabnya: esbuild (build:server / build:api) tidak membaca `paths` dari
 * tsconfig, sehingga alias `@/` gagal di-bundle.
 */

export type GrammarSection =
  | 'Verba'
  | 'Nomen & Artikel'
  | 'Adjektiva'
  | 'Pronomina'
  | 'Präpositionen'
  | 'Satzbau'
  | 'Konnektoren'
  | 'Wortbildung'
  | 'Partikeln'
  | 'Fungsional'

/** Kategori internal `buildQuestions` yang bisa disasar latihan. */
export type LatihanCategory = 'Verb' | 'Nomen' | 'Adjektiv' | 'Konjunktion' | 'Präposition'

export interface GrammarTopic {
  /** ID ASCII stabil, mis. "konjunktiv-2". */
  id: string
  /** Nama Jerman yang ditampilkan, mis. "Konjunktiv II". */
  german: string
  /** Label Indonesia, mis. "Konjunktiv II (Pengandaian)". */
  nameId: string
  section: GrammarSection
  /** Penjelasan konsep singkat dalam bahasa Indonesia (juga jadi acuan AI). */
  descriptionId: string
  /**
   * Kategori latihan internal yang bisa disasar, bila soal untuk topik ini dapat
   * diturunkan dari kosakata skenario.
   *
   * CATATAN: pemetaan ini KASAR. Kategori internal hanya tersedia untuk
   * Verb/Nomen/Adjektiv/Konjunktion/Präposition, sehingga topik seperti
   * anak kalimat (relativsatz, nebensatz-*) memakai 'Konjunktion' sebagai
   * penampung, bukan karena benar-benar sejenis kata sambung. Karena itu
   * pemetaan ini HANYA dipakai untuk mengurutkan soal, tidak pernah
   * ditampilkan sebagai klaim "soal ini melatih topik X".
   *
   * Topik tanpa field ini tidak memengaruhi soal sama sekali.
   */
  latihanCategory?: LatihanCategory
}

/** Urutan seksi sesuai taksonomi. */
export const SECTIONS: GrammarSection[] = [
  'Verba',
  'Nomen & Artikel',
  'Adjektiva',
  'Pronomina',
  'Präpositionen',
  'Satzbau',
  'Konnektoren',
  'Wortbildung',
  'Partikeln',
  'Fungsional',
]

/** Batas jumlah topik yang boleh dipilih (dipakai validasi server dan UI). */
export const MAX_GRAMMAR_TOPICS = 8

export const GRAMMAR_TOPICS: readonly GrammarTopic[] = [
  // --- Verba ---
  {
    id: 'tempus-perfekt',
    german: 'Perfekt',
    nameId: 'Perfekt (Lampau Percakapan)',
    section: 'Verba',
    descriptionId: 'Lampau untuk percakapan; memakai haben/sein + Partizip II.',
    latihanCategory: 'Verb',
  },
  {
    id: 'tempus-praeteritum',
    german: 'Präteritum',
    nameId: 'Präteritum (Lampau Tulisan)',
    section: 'Verba',
    descriptionId: 'Lampau untuk cerita/tulisan; wajib untuk sein, haben, Modalverben.',
    latihanCategory: 'Verb',
  },
  {
    id: 'tempus-plusquamperfekt',
    german: 'Plusquamperfekt',
    nameId: 'Plusquamperfekt (Lampau Sebelum Lampau)',
    section: 'Verba',
    descriptionId: 'Lampau sebelum lampau, biasanya berpasangan dengan nachdem.',
    latihanCategory: 'Verb',
  },
  {
    id: 'futur-1',
    german: 'Futur I',
    nameId: 'Futur I (Masa Depan & Dugaan)',
    section: 'Verba',
    descriptionId: 'werden + Infinitiv, untuk masa depan sekaligus dugaan.',
    latihanCategory: 'Verb',
  },
  {
    id: 'konjunktiv-2',
    german: 'Konjunktiv II',
    nameId: 'Konjunktiv II (Pengandaian & Sopan)',
    section: 'Verba',
    descriptionId: 'Kondisi tidak nyata, harapan, saran, permintaan sopan (würde, hätte, wäre, könnte).',
  },
  {
    id: 'konjunktiv-2-vergangenheit',
    german: 'Konjunktiv II der Vergangenheit',
    nameId: 'Konjunktiv II Bentuk Lampau (Penyesalan)',
    section: 'Verba',
    descriptionId: 'Menyesali/mengandaikan masa lampau: hätte … gemacht, wäre … gegangen.',
  },
  {
    id: 'passiv',
    german: 'Passiv',
    nameId: 'Passiv (Kalimat Pasif)',
    section: 'Verba',
    descriptionId: 'Fokus ke kejadian/objek, bukan pelaku: werden + Partizip II.',
    latihanCategory: 'Verb',
  },
  {
    id: 'passiv-modalverben',
    german: 'Passiv mit Modalverben',
    nameId: 'Passiv dengan Kata Kerja Modal',
    section: 'Verba',
    descriptionId: 'Passiv yang digabung Modalverben: muss gemacht werden.',
    latihanCategory: 'Verb',
  },
  {
    id: 'verben-mit-praepositionen',
    german: 'Verben mit Präpositionen',
    nameId: 'Kata Kerja Berpreposisi',
    section: 'Verba',
    descriptionId: 'warten auf, sich interessieren für, abhängen von + objek preposisional.',
  },
  {
    id: 'reflexive-verben',
    german: 'Reflexive Verben',
    nameId: 'Kata Kerja Refleksif',
    section: 'Verba',
    descriptionId: 'Kata kerja dengan sich, baik refleksif murni maupun resiprokal.',
    latihanCategory: 'Verb',
  },
  {
    id: 'trennbare-verben',
    german: 'Trennbare und untrennbare Verben',
    nameId: 'Kata Kerja Terpisah & Tak Terpisah',
    section: 'Verba',
    descriptionId: 'Awalan yang bisa terpisah (aufstehen) dan yang tidak (bezahlen).',
    latihanCategory: 'Verb',
  },
  {
    id: 'infinitiv-mit-zu',
    german: 'Infinitiv mit zu',
    nameId: 'Infinitiv dengan zu',
    section: 'Verba',
    descriptionId: 'zu + Infinitiv serta varian um … zu, anstatt … zu, ohne … zu.',
  },

  // --- Nomen & Artikel ---
  {
    id: 'artikel-kasus',
    german: 'Artikel im Nominativ, Akkusativ, Dativ',
    nameId: 'Artikel dalam Kasus Nominatif/Akusatif/Datif',
    section: 'Nomen & Artikel',
    descriptionId: 'Perubahan bentuk artikel mengikuti kasus (der/die/das → den/dem/der).',
    latihanCategory: 'Nomen',
  },
  {
    id: 'genitiv',
    german: 'Genitiv',
    nameId: 'Genitiv (Kepemilikan)',
    section: 'Nomen & Artikel',
    descriptionId: 'Genitiv sebagai atribut dan setelah wegen, trotz, während, statt.',
    latihanCategory: 'Nomen',
  },
  {
    id: 'n-deklination',
    german: 'n-Deklination',
    nameId: 'Deklinasi-n (Nomina Lemah)',
    section: 'Nomen & Artikel',
    descriptionId: 'Nomina lemah: der Kollege → den Kollegen, der Junge, der Mensch.',
    latihanCategory: 'Nomen',
  },
  {
    id: 'pluralbildung',
    german: 'Pluralbildung',
    nameId: 'Pembentukan Bentuk Jamak',
    section: 'Nomen & Artikel',
    descriptionId: 'Lima pola utama pembentukan jamak beserta pengecualiannya.',
    latihanCategory: 'Nomen',
  },
  {
    id: 'negation-nicht-kein',
    german: 'Negation: nicht oder kein',
    nameId: 'Negasi: nicht atau kein',
    section: 'Nomen & Artikel',
    descriptionId: 'Perbedaan pemakaian nicht dan kein, serta doch sebagai jawaban positif.',
  },
  {
    id: 'nominalisierung',
    german: 'Nominalisierung',
    nameId: 'Nominalisasi',
    section: 'Nomen & Artikel',
    descriptionId: 'Mengubah verba/adjektiva menjadi nomina: das Lesen, die Möglichkeit.',
    latihanCategory: 'Nomen',
  },

  // --- Adjektiva ---
  {
    id: 'adjektivdeklination',
    german: 'Adjektivdeklination',
    nameId: 'Deklinasi Adjektiva',
    section: 'Adjektiva',
    descriptionId: 'Tiga tipe deklinasi: lemah, kuat, dan campuran.',
    latihanCategory: 'Adjektiv',
  },
  {
    id: 'komparativ-superlativ',
    german: 'Komparativ und Superlativ',
    nameId: 'Komparatif & Superlatif',
    section: 'Adjektiva',
    descriptionId: 'Tingkat perbandingan termasuk bentuk tak beraturan (gut–besser–best).',
    latihanCategory: 'Adjektiv',
  },
  {
    id: 'vergleich-als-wie',
    german: 'Vergleich mit als und wie',
    nameId: 'Perbandingan dengan als & wie',
    section: 'Adjektiva',
    descriptionId: 'als untuk berbeda, wie untuk sama; serta je … desto/umso.',
    latihanCategory: 'Adjektiv',
  },
  {
    id: 'adjektiv-mit-praeposition',
    german: 'Adjektiv mit Präposition',
    nameId: 'Adjektiva Berpreposisi',
    section: 'Adjektiva',
    descriptionId: 'abhängig von, stolz auf, zufrieden mit.',
    latihanCategory: 'Adjektiv',
  },
  {
    id: 'partizip-als-adjektiv',
    german: 'Partizip I und II als Adjektiv',
    nameId: 'Partisip sebagai Adjektiva',
    section: 'Adjektiva',
    descriptionId: 'das laufende Kind, das geschriebene Buch.',
    latihanCategory: 'Adjektiv',
  },

  // --- Pronomina ---
  {
    id: 'personalpronomen-kasus',
    german: 'Personalpronomen im Dativ und Akkusativ',
    nameId: 'Pronomina Persona (Datif & Akusatif)',
    section: 'Pronomina',
    descriptionId: 'Bentuk datif/akusatif dan urutannya: Ich gebe es ihm.',
  },
  {
    id: 'reflexivpronomen',
    german: 'Reflexivpronomen',
    nameId: 'Pronomina Refleksif',
    section: 'Pronomina',
    descriptionId: 'mich/mir, dich/dir, sich dan pemakaiannya.',
  },
  {
    id: 'relativpronomen',
    german: 'Relativpronomen',
    nameId: 'Pronomina Relatif',
    section: 'Pronomina',
    descriptionId: 'der/die/das sebagai penghubung, termasuk dengan preposisi.',
  },
  {
    id: 'indefinitpronomen',
    german: 'Indefinitpronomen',
    nameId: 'Pronomina Tak Tentu',
    section: 'Pronomina',
    descriptionId: 'man, jemand, niemand, etwas, nichts, jeder, alle.',
  },
  {
    id: 'possessivartikel',
    german: 'Possessivartikel',
    nameId: 'Kata Milik (Posesif)',
    section: 'Pronomina',
    descriptionId: 'mein, dein, sein, ihr dan penggantinya sebagai pronomina.',
  },

  // --- Präpositionen ---
  {
    id: 'praeposition-wechsel',
    german: 'Wechselpräpositionen',
    nameId: 'Preposisi Berganti (Wohin/Wo)',
    section: 'Präpositionen',
    descriptionId: 'Logika Wohin (Akkusativ) vs Wo (Dativ): legen/liegen, stellen/stehen.',
    latihanCategory: 'Präposition',
  },
  {
    id: 'praeposition-temporal',
    german: 'Temporale Präpositionen',
    nameId: 'Preposisi Waktu',
    section: 'Präpositionen',
    descriptionId: 'vor, nach, in, seit, bis, ab untuk keterangan waktu.',
    latihanCategory: 'Präposition',
  },
  {
    id: 'praeposition-lokal',
    german: 'Lokale Präpositionen',
    nameId: 'Preposisi Tempat',
    section: 'Präpositionen',
    descriptionId: 'Preposisi penunjuk tempat dan kasus yang diwajibkannya.',
    latihanCategory: 'Präposition',
  },
  {
    id: 'praepositionaladverbien',
    german: 'Präpositionaladverbien',
    nameId: 'Adverbia Preposisional (da-/wo-)',
    section: 'Präpositionen',
    descriptionId: 'dafür, damit, davon dan bentuk tanya worauf, womit, wovon.',
  },

  // --- Satzbau ---
  {
    id: 'nebensatz-weil-dass',
    german: 'Nebensatz mit weil und dass',
    nameId: 'Anak Kalimat dengan weil & dass',
    section: 'Satzbau',
    descriptionId: 'Kata kerja berpindah ke akhir kalimat pada anak kalimat.',
    latihanCategory: 'Konjunktion',
  },
  {
    id: 'nebensatz-als-wenn',
    german: 'Nebensatz mit als und wenn',
    nameId: 'Anak Kalimat dengan als & wenn',
    section: 'Satzbau',
    descriptionId: 'als untuk satu kejadian lampau, wenn untuk berulang/kondisi.',
    latihanCategory: 'Konjunktion',
  },
  {
    id: 'nebensatz-nachdem',
    german: 'Nebensatz mit nachdem',
    nameId: 'Anak Kalimat dengan nachdem',
    section: 'Satzbau',
    descriptionId: 'Urutan waktu dengan Plusquamperfekt pada klausa nachdem.',
    latihanCategory: 'Konjunktion',
  },
  {
    id: 'relativsatz',
    german: 'Relativsatz',
    nameId: 'Kalimat Relatif',
    section: 'Satzbau',
    descriptionId: 'Anak kalimat penjelas dengan pronomina relatif.',
    latihanCategory: 'Konjunktion',
  },
  {
    id: 'tekamolo',
    german: 'TeKaMoLo',
    nameId: 'Urutan Keterangan TeKaMoLo',
    section: 'Satzbau',
    descriptionId: 'Urutan Temporal–Kausal–Modal–Lokal dalam kalimat.',
  },
  {
    id: 'wortstellung-nicht',
    german: 'Stellung von nicht',
    nameId: 'Posisi nicht dalam Kalimat',
    section: 'Satzbau',
    descriptionId: 'Penempatan nicht sesuai bagian kalimat yang dinegasikan.',
  },

  // --- Konnektoren ---
  {
    id: 'konnektor-deshalb',
    german: 'Konjunktionaladverbien',
    nameId: 'Adverbia Penghubung (deshalb, trotzdem)',
    section: 'Konnektoren',
    descriptionId: 'Kata kerja tetap di posisi kedua sehingga terjadi inversi.',
    latihanCategory: 'Konjunktion',
  },
  {
    id: 'konnektor-obwohl',
    german: 'Konzessivsatz mit obwohl',
    nameId: 'Kalimat Konsesif dengan obwohl',
    section: 'Konnektoren',
    descriptionId: 'obwohl (anak kalimat) dibedakan dari trotzdem (adverbia penghubung).',
    latihanCategory: 'Konjunktion',
  },
  {
    id: 'konnektor-damit-umzu',
    german: 'damit und um … zu',
    nameId: 'Tujuan: damit & um … zu',
    section: 'Konnektoren',
    descriptionId: 'Ungkapan tujuan; pilih damit atau um … zu sesuai subjek.',
    latihanCategory: 'Konjunktion',
  },
  {
    id: 'konnektor-zweiteilig',
    german: 'Zweiteilige Konnektoren',
    nameId: 'Konjungsi Berpasangan',
    section: 'Konnektoren',
    descriptionId: 'entweder…oder, weder…noch, sowohl…als auch, je…desto.',
    latihanCategory: 'Konjunktion',
  },

  // --- Wortbildung ---
  {
    id: 'wortbildung-suffixe',
    german: 'Suffixe: -ung, -heit, -keit',
    nameId: 'Akhiran Pembentuk Kata',
    section: 'Wortbildung',
    descriptionId: 'Akhiran -ung, -heit, -keit, -schaft, -lich, -ig, -bar, -los.',
  },
  {
    id: 'wortbildung-komposita',
    german: 'Komposita',
    nameId: 'Kata Majemuk',
    section: 'Wortbildung',
    descriptionId: 'Gabungan dua kata benda menjadi satu, seperti die Hausaufgabe oder das Wörterbuch.',
    latihanCategory: 'Nomen',
  },
  {
    id: 'wortbildung-praefixe',
    german: 'Präfixe: un-, miss-, vor-',
    nameId: 'Awalan Pembentuk Kata',
    section: 'Wortbildung',
    descriptionId: 'Awalan un-, miss-, vor-, nach-, wieder- dan perubahan maknanya.',
  },

  // --- Partikeln ---
  {
    id: 'modalpartikeln',
    german: 'Modalpartikeln',
    nameId: 'Partikel Modal (doch, mal, ja)',
    section: 'Partikeln',
    descriptionId: 'doch, mal, denn, ja, eigentlich, wohl yang membuat bahasa terdengar natural.',
  },
  {
    id: 'gradpartikeln',
    german: 'Gradpartikeln',
    nameId: 'Partikel Tingkat (sehr, ziemlich)',
    section: 'Partikeln',
    descriptionId: 'sehr, ziemlich, recht, ganz, total untuk menyatakan kadar.',
  },

  // --- Fungsional ---
  {
    id: 'fungsional-meinung',
    german: 'Meinung äußern',
    nameId: 'Menyampaikan Pendapat',
    section: 'Fungsional',
    descriptionId: 'Ich finde…, Meiner Meinung nach…, einerseits…andererseits.',
  },
  {
    id: 'fungsional-rat',
    german: 'Ratschläge geben',
    nameId: 'Memberi Saran',
    section: 'Fungsional',
    descriptionId: 'Memakai Konjunktiv II: Du solltest …, An deiner Stelle würde ich …',
  },
  {
    id: 'fungsional-vermutung',
    german: 'Vermutungen äußern',
    nameId: 'Menyatakan Dugaan',
    section: 'Fungsional',
    descriptionId: 'Futur I dan Modalverben subjektif untuk menduga.',
  },
  {
    id: 'fungsional-erzaehlen',
    german: 'Vergangenes erzählen',
    nameId: 'Menceritakan Kejadian Lampau',
    section: 'Fungsional',
    descriptionId: 'Perfekt/Präteritum + Plusquamperfekt + nachdem.',
  },
]

/** Himpunan ID untuk pengecekan cepat. */
export const GRAMMAR_TOPIC_IDS: ReadonlySet<string> = new Set(GRAMMAR_TOPICS.map((t) => t.id))

/** Apakah nilai berupa ID topik yang dikenal. */
export function isGrammarTopicId(value: unknown): value is string {
  return typeof value === 'string' && GRAMMAR_TOPIC_IDS.has(value)
}

/** Topik dikelompokkan per seksi, urut sesuai SECTIONS. */
export function topicsBySection(
  topics: readonly GrammarTopic[] = GRAMMAR_TOPICS
): Map<GrammarSection, GrammarTopic[]> {
  const grouped = new Map<GrammarSection, GrammarTopic[]>()
  for (const section of SECTIONS) grouped.set(section, [])
  for (const topic of topics) grouped.get(topic.section)?.push(topic)
  return grouped
}

/**
 * Validasi KETAT untuk input dari klien.
 *
 * MENOLAK seluruh input bila ada satu ID tak dikenal, supaya kesalahan klien
 * terlihat jelas sebagai 400 dan bukan diam-diam diabaikan. (Penyaringan ID
 * yang mengarang pada keluaran AI dilakukan oleh Effect Schema di
 * src/server/effect/schemas.ts dan parser klien, bukan di sini.)
 * Mengembalikan null bila tidak sah.
 */
export function validateTopicIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  if (raw.length > MAX_GRAMMAR_TOPICS) return null
  if (raw.some((v) => typeof v !== 'string' || !GRAMMAR_TOPIC_IDS.has(v))) return null

  return [...new Set(raw as string[])]
}
