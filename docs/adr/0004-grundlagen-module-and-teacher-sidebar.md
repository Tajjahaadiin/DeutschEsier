# 0004. Modul Fondasi Bahasa (Die Grundlagen) dan Dashboard Guru Bersidebar

Aplikasi DeutschEasier berkembang dari sekadar pembuat skenario dialog AI menjadi platform komprehensif yang memuat Bank Kata kognat, pelafalan alfabet (Das Alphabet), latihan angka & hitung benda (Die Nummer), dan kalender waktu (Die Tage). Pengelompokan materi dan pemisahan pengalaman pengguna antara guru dan murid perlu dipertegas.

Kami memutuskan:
1. **Membakukan Modul `Die Grundlagen` (Fondasi Dasar)**:
   Menyatukan empat modul materi dasar mandiri (Bank Kata, Das Alphabet, Die Nummer, Die Tage) ke dalam satu kategori resmi bernama `Die Grundlagen`.
2. **Akses Murid Berbasis Kunci (Single-Session Token `grundlagen`)**:
   Murid dapat mengakses modul `Die Grundlagen` melalui kunci akses berbatas waktu (`DE-XXXXX`) via rute `/grundlagen?key=...`. Alih-alih membuat skema database baru, sistem memanfaatkan infrastruktur `scenario_access_key` yang sudah ada dengan mencadangkan ID sesi sistem tetap: `sessionId = "grundlagen"`. Murid tanpa kunci dihadang oleh *Access Gate*.
3. **Dashboard Guru dengan Sidebar**:
   Menggantikan navigasi horizontal yang padat pada `HomePage` guru dengan layout dashboard standar bersidebar (desktop: sidebar kiri tetap; mobile: drawer menu responsif), yang membagi ruang kerja guru menjadi dua pilar utama:
   - **Skenario Percakapan (Szenarien)**: Daftar skenario AI, pembuatan skenario, analitik nilai kuis, dan kunci akses per skenario.
   - **Die Grundlagen**: Ruang kontrol materi fondasi dasar dan penerbitan kunci akses Grundlagen untuk murid.
