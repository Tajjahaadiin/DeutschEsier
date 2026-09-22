import 'dotenv/config'
import { db } from './client'
import { wordBank, type NewWordBank } from './schema'

const cognatesData: NewWordBank[] = [
  // Rumah & Benda (15)
  { germanWord: 'Lampe', article: 'die', indonesianWord: 'lampu', englishMeaning: 'lamp', category: 'Rumah & Benda', phoneticSimilarity: 5, exampleSentenceDe: 'Die Lampe ist hell.', exampleSentenceId: 'Lampunya terang.', cefrLevel: 'A1' },
  { germanWord: 'Kammer', article: 'die', indonesianWord: 'kamar', englishMeaning: 'chamber/room', category: 'Rumah & Benda', phoneticSimilarity: 4, exampleSentenceDe: 'Die Kammer ist klein.', exampleSentenceId: 'Kamarnya kecil.', cefrLevel: 'A2' },
  { germanWord: 'Glas', article: 'das', indonesianWord: 'gelas', englishMeaning: 'glass', category: 'Rumah & Benda', phoneticSimilarity: 4, exampleSentenceDe: 'Das Glas ist leer.', exampleSentenceId: 'Gelasnya kosong.', cefrLevel: 'A1' },
  { germanWord: 'Eimer', article: 'der', indonesianWord: 'ember', englishMeaning: 'bucket', category: 'Rumah & Benda', phoneticSimilarity: 4, exampleSentenceDe: 'Der Eimer ist voll.', exampleSentenceId: 'Embernya penuh.', cefrLevel: 'B1' },
  { germanWord: 'Handtuch', article: 'das', indonesianWord: 'handuk', englishMeaning: 'towel', category: 'Rumah & Benda', phoneticSimilarity: 4, exampleSentenceDe: 'Ich brauche ein Handtuch.', exampleSentenceId: 'Saya butuh handuk.', cefrLevel: 'A1' },
  { germanWord: 'Tasche', article: 'die', indonesianWord: 'tas', englishMeaning: 'bag', category: 'Rumah & Benda', phoneticSimilarity: 5, exampleSentenceDe: 'Meine Tasche ist schwer.', exampleSentenceId: 'Tas saya berat.', cefrLevel: 'A1' },
  { germanWord: 'Sofa', article: 'das', indonesianWord: 'sofa', englishMeaning: 'sofa', category: 'Rumah & Benda', phoneticSimilarity: 5, exampleSentenceDe: 'Das Sofa ist bequem.', exampleSentenceId: 'Sofanya nyaman.', cefrLevel: 'A1' },
  { germanWord: 'Matratze', article: 'die', indonesianWord: 'matras', englishMeaning: 'mattress', category: 'Rumah & Benda', phoneticSimilarity: 4, exampleSentenceDe: 'Die Matratze ist weich.', exampleSentenceId: 'Matrasnya empuk.', cefrLevel: 'A2' },
  { germanWord: 'Kessel', article: 'der', indonesianWord: 'ketel', englishMeaning: 'kettle', category: 'Rumah & Benda', phoneticSimilarity: 4, exampleSentenceDe: 'Der Kessel pfeift.', exampleSentenceId: 'Ketelnya berbunyi.', cefrLevel: 'B1' },
  { germanWord: 'Kabel', article: 'das', indonesianWord: 'kabel', englishMeaning: 'cable', category: 'Rumah & Benda', phoneticSimilarity: 5, exampleSentenceDe: 'Das Kabel ist zu kurz.', exampleSentenceId: 'Kabelnya terlalu pendek.', cefrLevel: 'A2' },
  { germanWord: 'Schalter', article: 'der', indonesianWord: 'sakelar', englishMeaning: 'switch', category: 'Rumah & Benda', phoneticSimilarity: 3, exampleSentenceDe: 'Wo ist der Schalter?', exampleSentenceId: 'Di mana sakelarnya?', cefrLevel: 'A2' },
  { germanWord: 'Steckdose', article: 'die', indonesianWord: 'stopkontak', englishMeaning: 'socket', category: 'Rumah & Benda', phoneticSimilarity: 2, exampleSentenceDe: 'Ich suche eine Steckdose.', exampleSentenceId: 'Saya mencari stopkontak.', cefrLevel: 'A2' },
  { germanWord: 'Schraube', article: 'die', indonesianWord: 'sekrup', englishMeaning: 'screw', category: 'Rumah & Benda', phoneticSimilarity: 3, exampleSentenceDe: 'Die Schraube ist locker.', exampleSentenceId: 'Sekrupnya longgar.', cefrLevel: 'B1' },
  { germanWord: 'Bohrer', article: 'der', indonesianWord: 'bor', englishMeaning: 'drill', category: 'Rumah & Benda', phoneticSimilarity: 4, exampleSentenceDe: 'Er benutzt einen Bohrer.', exampleSentenceId: 'Dia menggunakan bor.', cefrLevel: 'B1' },
  { germanWord: 'Zange', article: 'die', indonesianWord: 'tang', englishMeaning: 'pliers', category: 'Rumah & Benda', phoneticSimilarity: 3, exampleSentenceDe: 'Gib mir die Zange.', exampleSentenceId: 'Berikan tang itu kepadaku.', cefrLevel: 'B1' },

  // Makanan & Minuman (15)
  { germanWord: 'Kaffee', article: 'der', indonesianWord: 'kopi', englishMeaning: 'coffee', category: 'Makanan & Minuman', phoneticSimilarity: 4, exampleSentenceDe: 'Ich trinke gern Kaffee.', exampleSentenceId: 'Saya suka minum kopi.', cefrLevel: 'A1' },
  { germanWord: 'Tee', article: 'der', indonesianWord: 'teh', englishMeaning: 'tea', category: 'Makanan & Minuman', phoneticSimilarity: 4, exampleSentenceDe: 'Möchtest du Tee?', exampleSentenceId: 'Apakah kamu mau teh?', cefrLevel: 'A1' },
  { germanWord: 'Bier', article: 'das', indonesianWord: 'bir', englishMeaning: 'beer', category: 'Makanan & Minuman', phoneticSimilarity: 5, exampleSentenceDe: 'Ein kaltes Bier, bitte.', exampleSentenceId: 'Minta satu bir dingin.', cefrLevel: 'A1' },
  { germanWord: 'Schokolade', article: 'die', indonesianWord: 'cokelat', englishMeaning: 'chocolate', category: 'Makanan & Minuman', phoneticSimilarity: 4, exampleSentenceDe: 'Ich liebe Schokolade.', exampleSentenceId: 'Saya cinta cokelat.', cefrLevel: 'A1' },
  { germanWord: 'Tomate', article: 'die', indonesianWord: 'tomat', englishMeaning: 'tomato', category: 'Makanan & Minuman', phoneticSimilarity: 5, exampleSentenceDe: 'Die Tomate ist rot.', exampleSentenceId: 'Tomatnya merah.', cefrLevel: 'A1' },
  { germanWord: 'Vanille', article: 'die', indonesianWord: 'vanili', englishMeaning: 'vanilla', category: 'Makanan & Minuman', phoneticSimilarity: 4, exampleSentenceDe: 'Vanilleeis ist lecker.', exampleSentenceId: 'Es krim vanili lezat.', cefrLevel: 'A2' },
  { germanWord: 'Salat', article: 'der', indonesianWord: 'selada', englishMeaning: 'salad/lettuce', category: 'Makanan & Minuman', phoneticSimilarity: 4, exampleSentenceDe: 'Wir essen Salat.', exampleSentenceId: 'Kita makan selada.', cefrLevel: 'A1' },
  { germanWord: 'Suppe', article: 'die', indonesianWord: 'sup', englishMeaning: 'soup', category: 'Makanan & Minuman', phoneticSimilarity: 5, exampleSentenceDe: 'Die Suppe ist heiß.', exampleSentenceId: 'Supnya panas.', cefrLevel: 'A1' },
  { germanWord: 'Sauce', article: 'die', indonesianWord: 'saus', englishMeaning: 'sauce', category: 'Makanan & Minuman', phoneticSimilarity: 4, exampleSentenceDe: 'Die Sauce ist scharf.', exampleSentenceId: 'Sausnya pedas.', cefrLevel: 'A2' },
  { germanWord: 'Bonbon', article: 'das', indonesianWord: 'bonbon', englishMeaning: 'candy', category: 'Makanan & Minuman', phoneticSimilarity: 5, exampleSentenceDe: 'Möchtest du ein Bonbon?', exampleSentenceId: 'Mau permen (bonbon)?', cefrLevel: 'A2' },
  { germanWord: 'Sirup', article: 'der', indonesianWord: 'sirup', englishMeaning: 'syrup', category: 'Makanan & Minuman', phoneticSimilarity: 5, exampleSentenceDe: 'Ich mag Sirup.', exampleSentenceId: 'Saya suka sirup.', cefrLevel: 'A2' },
  { germanWord: 'Mayonnaise', article: 'die', indonesianWord: 'mayones', englishMeaning: 'mayonnaise', category: 'Makanan & Minuman', phoneticSimilarity: 5, exampleSentenceDe: 'Pommes mit Mayonnaise.', exampleSentenceId: 'Kentang goreng dengan mayones.', cefrLevel: 'A2' },
  { germanWord: 'Pasta', article: 'die', indonesianWord: 'pasta', englishMeaning: 'pasta', category: 'Makanan & Minuman', phoneticSimilarity: 5, exampleSentenceDe: 'Heute gibt es Pasta.', exampleSentenceId: 'Hari ini ada pasta.', cefrLevel: 'A1' },
  { germanWord: 'Steak', article: 'das', indonesianWord: 'bistik', englishMeaning: 'steak', category: 'Makanan & Minuman', phoneticSimilarity: 3, exampleSentenceDe: 'Das Steak ist gut.', exampleSentenceId: 'Bistiknya enak.', cefrLevel: 'A2' },
  { germanWord: 'Zitrone', article: 'die', indonesianWord: 'sitrun', englishMeaning: 'lemon', category: 'Makanan & Minuman', phoneticSimilarity: 4, exampleSentenceDe: 'Die Zitrone ist sauer.', exampleSentenceId: 'Sitrunnya asam.', cefrLevel: 'A2' },

  // Medis & Kesehatan (15)
  { germanWord: 'Apotheke', article: 'die', indonesianWord: 'apotek', englishMeaning: 'pharmacy', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Wo ist die Apotheke?', exampleSentenceId: 'Di mana apotek?', cefrLevel: 'A1' },
  { germanWord: 'Doktor', article: 'der', indonesianWord: 'dokter', englishMeaning: 'doctor', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Der Doktor kommt gleich.', exampleSentenceId: 'Dokternya segera datang.', cefrLevel: 'A1' },
  { germanWord: 'Patient', article: 'der', indonesianWord: 'pasien', englishMeaning: 'patient', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Der Patient schläft.', exampleSentenceId: 'Pasiennya tidur.', cefrLevel: 'A2' },
  { germanWord: 'Operation', article: 'die', indonesianWord: 'operasi', englishMeaning: 'operation', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Die Operation war erfolgreich.', exampleSentenceId: 'Operasinya sukses.', cefrLevel: 'B1' },
  { germanWord: 'Pflaster', article: 'das', indonesianWord: 'plester', englishMeaning: 'plaster/band-aid', category: 'Medis & Kesehatan', phoneticSimilarity: 4, exampleSentenceDe: 'Ich brauche ein Pflaster.', exampleSentenceId: 'Saya butuh plester.', cefrLevel: 'A2' },
  { germanWord: 'Verband', article: 'der', indonesianWord: 'perban', englishMeaning: 'bandage', category: 'Medis & Kesehatan', phoneticSimilarity: 4, exampleSentenceDe: 'Der Verband ist neu.', exampleSentenceId: 'Perbannya baru.', cefrLevel: 'B1' },
  { germanWord: 'Rezept', article: 'das', indonesianWord: 'resep', englishMeaning: 'prescription', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Haben Sie ein Rezept?', exampleSentenceId: 'Apakah Anda punya resep?', cefrLevel: 'A2' },
  { germanWord: 'Pille', article: 'die', indonesianWord: 'pil', englishMeaning: 'pill', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Nimm die Pille.', exampleSentenceId: 'Minum pilnya.', cefrLevel: 'A2' },
  { germanWord: 'Tablette', article: 'die', indonesianWord: 'tablet', englishMeaning: 'tablet', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Eine Tablette am Tag.', exampleSentenceId: 'Satu tablet sehari.', cefrLevel: 'A2' },
  { germanWord: 'Kapsel', article: 'die', indonesianWord: 'kapsul', englishMeaning: 'capsule', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Schluck die Kapsel.', exampleSentenceId: 'Telan kapsulnya.', cefrLevel: 'B1' },
  { germanWord: 'Klinik', article: 'die', indonesianWord: 'klinik', englishMeaning: 'clinic', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Er ist in der Klinik.', exampleSentenceId: 'Dia ada di klinik.', cefrLevel: 'A2' },
  { germanWord: 'Quarantäne', article: 'die', indonesianWord: 'karantina', englishMeaning: 'quarantine', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Wir sind in Quarantäne.', exampleSentenceId: 'Kita ada di karantina.', cefrLevel: 'B1' },
  { germanWord: 'Virus', article: 'das', indonesianWord: 'virus', englishMeaning: 'virus', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Das Virus ist gefährlich.', exampleSentenceId: 'Virus itu berbahaya.', cefrLevel: 'B1' },
  { germanWord: 'Bakterie', article: 'die', indonesianWord: 'bakteri', englishMeaning: 'bacteria', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Bakterien sind überall.', exampleSentenceId: 'Bakteri ada di mana-mana.', cefrLevel: 'B1' },
  { germanWord: 'Organ', article: 'das', indonesianWord: 'organ', englishMeaning: 'organ', category: 'Medis & Kesehatan', phoneticSimilarity: 5, exampleSentenceDe: 'Das Herz ist ein Organ.', exampleSentenceId: 'Jantung adalah sebuah organ.', cefrLevel: 'B1' },

  // Tempat & Bangunan (15)
  { germanWord: 'Fabrik', article: 'die', indonesianWord: 'pabrik', englishMeaning: 'factory', category: 'Tempat & Bangunan', phoneticSimilarity: 4, exampleSentenceDe: 'Er arbeitet in der Fabrik.', exampleSentenceId: 'Dia bekerja di pabrik.', cefrLevel: 'A2' },
  { germanWord: 'Post', article: 'die', indonesianWord: 'pos', englishMeaning: 'post office', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Ich gehe zur Post.', exampleSentenceId: 'Saya pergi ke kantor pos.', cefrLevel: 'A1' },
  { germanWord: 'Büro', article: 'das', indonesianWord: 'biro', englishMeaning: 'office', category: 'Tempat & Bangunan', phoneticSimilarity: 4, exampleSentenceDe: 'Mein Büro ist im Zentrum.', exampleSentenceId: 'Biro (kantor) saya ada di pusat.', cefrLevel: 'A1' },
  { germanWord: 'Bank', article: 'die', indonesianWord: 'bank', englishMeaning: 'bank', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Die Bank schließt bald.', exampleSentenceId: 'Banknya akan segera tutup.', cefrLevel: 'A1' },
  { germanWord: 'Station', article: 'die', indonesianWord: 'stasiun', englishMeaning: 'station', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Nächste Station ist hier.', exampleSentenceId: 'Stasiun berikutnya di sini.', cefrLevel: 'A1' },
  { germanWord: 'Museum', article: 'das', indonesianWord: 'museum', englishMeaning: 'museum', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Das Museum ist interessant.', exampleSentenceId: 'Museum itu menarik.', cefrLevel: 'A2' },
  { germanWord: 'Theater', article: 'das', indonesianWord: 'teater', englishMeaning: 'theater', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Wir gehen ins Theater.', exampleSentenceId: 'Kita pergi ke teater.', cefrLevel: 'A2' },
  { germanWord: 'Hotel', article: 'das', indonesianWord: 'hotel', englishMeaning: 'hotel', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Das Hotel ist teuer.', exampleSentenceId: 'Hotelnya mahal.', cefrLevel: 'A1' },
  { germanWord: 'Restaurant', article: 'das', indonesianWord: 'restoran', englishMeaning: 'restaurant', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Ein gutes Restaurant.', exampleSentenceId: 'Sebuah restoran yang bagus.', cefrLevel: 'A1' },
  { germanWord: 'Balkon', article: 'der', indonesianWord: 'balkon', englishMeaning: 'balcony', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Wir sitzen auf dem Balkon.', exampleSentenceId: 'Kita duduk di balkon.', cefrLevel: 'A2' },
  { germanWord: 'Terrasse', article: 'die', indonesianWord: 'teras', englishMeaning: 'terrace', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Die Terrasse ist schön.', exampleSentenceId: 'Terasnya indah.', cefrLevel: 'A2' },
  { germanWord: 'Korridor', article: 'der', indonesianWord: 'koridor', englishMeaning: 'corridor', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Der Korridor ist lang.', exampleSentenceId: 'Koridornya panjang.', cefrLevel: 'B1' },
  { germanWord: 'Toilette', article: 'die', indonesianWord: 'toilet', englishMeaning: 'toilet', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Wo ist die Toilette?', exampleSentenceId: 'Di mana toilet?', cefrLevel: 'A1' },
  { germanWord: 'Universität', article: 'die', indonesianWord: 'universitas', englishMeaning: 'university', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Sie studiert an der Universität.', exampleSentenceId: 'Dia kuliah di universitas.', cefrLevel: 'A2' },
  { germanWord: 'Institut', article: 'das', indonesianWord: 'institut', englishMeaning: 'institute', category: 'Tempat & Bangunan', phoneticSimilarity: 5, exampleSentenceDe: 'Das ist ein neues Institut.', exampleSentenceId: 'Ini adalah institut baru.', cefrLevel: 'B1' },

  // Pendidikan & Sains (19)
  { germanWord: 'Schule', article: 'die', indonesianWord: 'sekolah', englishMeaning: 'school', category: 'Pendidikan & Sains', phoneticSimilarity: 3, exampleSentenceDe: 'Die Schule beginnt.', exampleSentenceId: 'Sekolahnya dimulai.', cefrLevel: 'A1' },
  { germanWord: 'Buch', article: 'das', indonesianWord: 'buku', englishMeaning: 'book', category: 'Pendidikan & Sains', phoneticSimilarity: 4, exampleSentenceDe: 'Ich lese ein Buch.', exampleSentenceId: 'Saya membaca buku.', cefrLevel: 'A1' },
  { germanWord: 'Alphabet', article: 'das', indonesianWord: 'alfabet', englishMeaning: 'alphabet', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Wir lernen das Alphabet.', exampleSentenceId: 'Kita belajar alfabet.', cefrLevel: 'A1' },
  { germanWord: 'Text', article: 'der', indonesianWord: 'teks', englishMeaning: 'text', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Lies den Text.', exampleSentenceId: 'Bacalah teksnya.', cefrLevel: 'A1' },
  { germanWord: 'Paragraph', article: 'der', indonesianWord: 'paragraf', englishMeaning: 'paragraph', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Ein neuer Paragraph.', exampleSentenceId: 'Sebuah paragraf baru.', cefrLevel: 'A2' },
  { germanWord: 'Problem', article: 'das', indonesianWord: 'problem', englishMeaning: 'problem', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Das ist kein Problem.', exampleSentenceId: 'Itu bukan problem (masalah).', cefrLevel: 'A1' },
  { germanWord: 'Methode', article: 'die', indonesianWord: 'metode', englishMeaning: 'method', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Eine gute Methode.', exampleSentenceId: 'Sebuah metode yang bagus.', cefrLevel: 'B1' },
  { germanWord: 'System', article: 'das', indonesianWord: 'sistem', englishMeaning: 'system', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Das System funktioniert.', exampleSentenceId: 'Sistemnya berfungsi.', cefrLevel: 'A2' },
  { germanWord: 'Theorie', article: 'die', indonesianWord: 'teori', englishMeaning: 'theory', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Das ist nur Theorie.', exampleSentenceId: 'Itu hanya teori.', cefrLevel: 'B1' },
  { germanWord: 'Praxis', article: 'die', indonesianWord: 'praktik', englishMeaning: 'practice', category: 'Pendidikan & Sains', phoneticSimilarity: 4, exampleSentenceDe: 'In der Praxis ist es anders.', exampleSentenceId: 'Dalam praktik itu berbeda.', cefrLevel: 'B1' },
  { germanWord: 'Experiment', article: 'das', indonesianWord: 'eksperimen', englishMeaning: 'experiment', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Wir machen ein Experiment.', exampleSentenceId: 'Kita membuat eksperimen.', cefrLevel: 'B1' },
  { germanWord: 'Projekt', article: 'das', indonesianWord: 'proyek', englishMeaning: 'project', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Unser neues Projekt.', exampleSentenceId: 'Proyek baru kita.', cefrLevel: 'A2' },
  { germanWord: 'Biologie', article: 'die', indonesianWord: 'biologi', englishMeaning: 'biology', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Ich mag Biologie.', exampleSentenceId: 'Saya suka biologi.', cefrLevel: 'A2' },
  { germanWord: 'Physik', article: 'die', indonesianWord: 'fisika', englishMeaning: 'physics', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Physik ist schwer.', exampleSentenceId: 'Fisika itu sulit.', cefrLevel: 'A2' },
  { germanWord: 'Musik', article: 'die', indonesianWord: 'musik', englishMeaning: 'music', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Hörst du Musik?', exampleSentenceId: 'Apakah kamu mendengar musik?', cefrLevel: 'A1' },
  { germanWord: 'Gitarre', article: 'die', indonesianWord: 'gitar', englishMeaning: 'guitar', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Er spielt Gitarre.', exampleSentenceId: 'Dia bermain gitar.', cefrLevel: 'A1' },
  { germanWord: 'Klavier', article: 'das', indonesianWord: 'klavier', englishMeaning: 'piano', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Sie spielt Klavier.', exampleSentenceId: 'Dia bermain klavier (piano).', cefrLevel: 'A2' },
  { germanWord: 'Trompete', article: 'die', indonesianWord: 'terompet', englishMeaning: 'trumpet', category: 'Pendidikan & Sains', phoneticSimilarity: 4, exampleSentenceDe: 'Die Trompete ist laut.', exampleSentenceId: 'Terompetnya keras.', cefrLevel: 'B1' },
  { germanWord: 'Rhythmus', article: 'der', indonesianWord: 'ritme', englishMeaning: 'rhythm', category: 'Pendidikan & Sains', phoneticSimilarity: 5, exampleSentenceDe: 'Fühlst du den Rhythmus?', exampleSentenceId: 'Apakah kamu merasakan ritme itu?', cefrLevel: 'B1' },

  // Administrasi & Hukum (7)
  { germanWord: 'Formular', article: 'das', indonesianWord: 'formulir', englishMeaning: 'form', category: 'Administrasi & Hukum', phoneticSimilarity: 5, exampleSentenceDe: 'Füllen Sie das Formular aus.', exampleSentenceId: 'Isilah formulir ini.', cefrLevel: 'A1' },
  { germanWord: 'Akte', article: 'die', indonesianWord: 'akta', englishMeaning: 'file/act', category: 'Administrasi & Hukum', phoneticSimilarity: 4, exampleSentenceDe: 'Die Akte ist geschlossen.', exampleSentenceId: 'Aktanya ditutup.', cefrLevel: 'B1' },
  { germanWord: 'Dokument', article: 'das', indonesianWord: 'dokumen', englishMeaning: 'document', category: 'Administrasi & Hukum', phoneticSimilarity: 5, exampleSentenceDe: 'Ein wichtiges Dokument.', exampleSentenceId: 'Dokumen yang penting.', cefrLevel: 'A2' },
  { germanWord: 'Karte', article: 'die', indonesianWord: 'kartu', englishMeaning: 'card/map', category: 'Administrasi & Hukum', phoneticSimilarity: 4, exampleSentenceDe: 'Hier ist meine Karte.', exampleSentenceId: 'Ini kartu saya.', cefrLevel: 'A1' },
  { germanWord: 'Nummer', article: 'die', indonesianWord: 'nomor', englishMeaning: 'number', category: 'Administrasi & Hukum', phoneticSimilarity: 5, exampleSentenceDe: 'Wie ist deine Nummer?', exampleSentenceId: 'Berapa nomormu?', cefrLevel: 'A1' },
  { germanWord: 'Datum', article: 'das', indonesianWord: 'datum', englishMeaning: 'date', category: 'Administrasi & Hukum', phoneticSimilarity: 5, exampleSentenceDe: 'Welches Datum haben wir heute?', exampleSentenceId: 'Datum (tanggal) berapa hari ini?', cefrLevel: 'A1' },
  { germanWord: 'Protokoll', article: 'das', indonesianWord: 'protokol', englishMeaning: 'protocol/minutes', category: 'Administrasi & Hukum', phoneticSimilarity: 5, exampleSentenceDe: 'Schreiben Sie das Protokoll.', exampleSentenceId: 'Tulislah protokol (notulen).', cefrLevel: 'B1' },

  // Finansial & Bisnis (10)
  { germanWord: 'Prozent', article: 'das', indonesianWord: 'persen', englishMeaning: 'percent', category: 'Finansial & Bisnis', phoneticSimilarity: 5, exampleSentenceDe: 'Zehn Prozent Rabatt.', exampleSentenceId: 'Diskon sepuluh persen.', cefrLevel: 'A2' },
  { germanWord: 'Kasse', article: 'die', indonesianWord: 'kasir', englishMeaning: 'cash register', category: 'Finansial & Bisnis', phoneticSimilarity: 4, exampleSentenceDe: 'Zahlen Sie an der Kasse.', exampleSentenceId: 'Bayarlah di kasir (kassa).', cefrLevel: 'A1' },
  { germanWord: 'Quittung', article: 'die', indonesianWord: 'kuitansi', englishMeaning: 'receipt', category: 'Finansial & Bisnis', phoneticSimilarity: 4, exampleSentenceDe: 'Brauchen Sie eine Quittung?', exampleSentenceId: 'Apakah Anda butuh kuitansi?', cefrLevel: 'A2' },
  { germanWord: 'Saldo', article: 'der', indonesianWord: 'saldo', englishMeaning: 'balance', category: 'Finansial & Bisnis', phoneticSimilarity: 5, exampleSentenceDe: 'Wie hoch ist der Saldo?', exampleSentenceId: 'Berapa saldonya?', cefrLevel: 'B1' },
  { germanWord: 'Bankrott', article: 'der', indonesianWord: 'bangkrut', englishMeaning: 'bankruptcy', category: 'Finansial & Bisnis', phoneticSimilarity: 4, exampleSentenceDe: 'Die Firma ist bankrott.', exampleSentenceId: 'Perusahaannya bangkrut.', cefrLevel: 'B1' },
  { germanWord: 'Tarif', article: 'der', indonesianWord: 'tarif', englishMeaning: 'tariff', category: 'Finansial & Bisnis', phoneticSimilarity: 5, exampleSentenceDe: 'Das ist der normale Tarif.', exampleSentenceId: 'Ini tarif normal.', cefrLevel: 'B1' },
  { germanWord: 'Garantie', article: 'die', indonesianWord: 'garansi', englishMeaning: 'guarantee', category: 'Finansial & Bisnis', phoneticSimilarity: 5, exampleSentenceDe: 'Wir geben ein Jahr Garantie.', exampleSentenceId: 'Kami memberi satu tahun garansi.', cefrLevel: 'A2' },
  { germanWord: 'Gratis', article: null, indonesianWord: 'gratis', englishMeaning: 'free of charge', category: 'Finansial & Bisnis', phoneticSimilarity: 5, exampleSentenceDe: 'Das ist heute gratis.', exampleSentenceId: 'Hari ini itu gratis.', cefrLevel: 'A2' },
  { germanWord: 'Pension', article: 'die', indonesianWord: 'pensiun', englishMeaning: 'pension/guesthouse', category: 'Finansial & Bisnis', phoneticSimilarity: 5, exampleSentenceDe: 'Er ist in Pension.', exampleSentenceId: 'Dia sudah pensiun.', cefrLevel: 'B1' },
  { germanWord: 'Kurs', article: 'der', indonesianWord: 'kurs', englishMeaning: 'course/rate', category: 'Finansial & Bisnis', phoneticSimilarity: 5, exampleSentenceDe: 'Der Kurs ist hoch.', exampleSentenceId: 'Kursnya tinggi.', cefrLevel: 'A2' },

  // Transportasi & Teknik (5)
  { germanWord: 'Auto', article: 'das', indonesianWord: 'oto', englishMeaning: 'car', category: 'Transportasi & Teknik', phoneticSimilarity: 4, exampleSentenceDe: 'Ich fahre mit dem Auto.', exampleSentenceId: 'Saya pergi dengan oto (mobil).', cefrLevel: 'A1' },
  { germanWord: 'Bus', article: 'der', indonesianWord: 'bus', englishMeaning: 'bus', category: 'Transportasi & Teknik', phoneticSimilarity: 5, exampleSentenceDe: 'Der Bus kommt.', exampleSentenceId: 'Busnya datang.', cefrLevel: 'A1' },
  { germanWord: 'Motor', article: 'der', indonesianWord: 'motor', englishMeaning: 'motor', category: 'Transportasi & Teknik', phoneticSimilarity: 5, exampleSentenceDe: 'Der Motor ist laut.', exampleSentenceId: 'Motornya berisik.', cefrLevel: 'A2' },
  { germanWord: 'Bremse', article: 'die', indonesianWord: 'rem', englishMeaning: 'brake', category: 'Transportasi & Teknik', phoneticSimilarity: 3, exampleSentenceDe: 'Die Bremse ist defekt.', exampleSentenceId: 'Remnya rusak.', cefrLevel: 'B1' },
  { germanWord: 'Schaufel', article: 'die', indonesianWord: 'sekop', englishMeaning: 'shovel', category: 'Transportasi & Teknik', phoneticSimilarity: 4, exampleSentenceDe: 'Hol die Schaufel.', exampleSentenceId: 'Ambilkan sekopnya.', cefrLevel: 'B1' },

  // Sosial & Komunikasi (4)
  { germanWord: 'Familie', article: 'die', indonesianWord: 'famili', englishMeaning: 'family', category: 'Sosial & Komunikasi', phoneticSimilarity: 5, exampleSentenceDe: 'Meine Familie ist groß.', exampleSentenceId: 'Famili (Keluarga) saya besar.', cefrLevel: 'A1' },
  { germanWord: 'Telefon', article: 'das', indonesianWord: 'telepon', englishMeaning: 'telephone', category: 'Sosial & Komunikasi', phoneticSimilarity: 5, exampleSentenceDe: 'Das Telefon klingelt.', exampleSentenceId: 'Telepon berdering.', cefrLevel: 'A1' },
  { germanWord: 'Radio', article: 'das', indonesianWord: 'radio', englishMeaning: 'radio', category: 'Sosial & Komunikasi', phoneticSimilarity: 5, exampleSentenceDe: 'Ich höre oft Radio.', exampleSentenceId: 'Saya sering mendengar radio.', cefrLevel: 'A1' },
  { germanWord: 'Politik', article: 'die', indonesianWord: 'politik', englishMeaning: 'politics', category: 'Sosial & Komunikasi', phoneticSimilarity: 5, exampleSentenceDe: 'Politik ist kompliziert.', exampleSentenceId: 'Politik itu rumit.', cefrLevel: 'B1' }
]

async function seed() {
  console.log('Seeding Database...')
  let inserted = 0
  for (const word of cognatesData) {
    // Check if exists
    const exists = await db.query.wordBank.findFirst({
      where: (w, { eq }) => eq(w.germanWord, word.germanWord)
    })
    
    if (!exists) {
      await db.insert(wordBank).values(word)
      inserted++
    }
  }
  console.log(`Successfully seeded ${inserted} new words. Total words in data: ${cognatesData.length}`)
}

seed().catch(console.error).finally(() => process.exit(0))
