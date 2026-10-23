# 0004. Endpoint Neural sebagai Satu-satunya Sumber Persona TTS

ADR-0003 menetapkan enam persona suara lewat pustaka `msedge-tts`. Sejak itu dua hal berubah. Pertama,
pada 10 Oktober 2026 Microsoft memindahkan endpoint sintesis Edge Read Aloud ke
`api.msedgeservices.com`, menambahkan `Ocp-Apim-Subscription-Key`, dan memperketat token `Sec-MS-GEC`;
`msedge-tts` gagal dengan `403 Forbidden` dan diganti `node-edge-tts` 1.2.11 pada commit `22b39b3`.
Kedua, insiden itu menyembunyikan cacat yang lebih lama: bahkan ketika `/api/tts` sehat, persona yang
dipilih pengguna tidak pernah terdengar berbeda. `AlphabetPage` menampilkan `<select>` berisi enam
persona lalu menciutkannya menjadi `voiceGender` sebelum menyeberang ke `AlphabetCard`,
`SpellingTrainer`, dan `AlphabetDetailModal`; di `audio.ts` gerbang `shouldUseEdgeTts` hanya membuka
endpoint neural bila `personaId` dikirim eksplisit, sehingga pemanggil yang hanya punya gender memutar
voice default browser dengan `pitch: 0.80`/`1.05`. Enam persona runtuh menjadi satu suara yang nadanya
digeser.

Kami memutuskan:

1. **`node-edge-tts` (MIT) tetap pustaka server.** Token `Sec-MS-GEC` diturunkan dari
   `CHROMIUM_FULL_VERSION` dan `TRUSTED_CLIENT_TOKEN` yang dipatok di dalam paket, jadi ketika Microsoft
   berubah lagi, jalur perbaikan pertama adalah menaikkan versi pustaka — bukan menulis ulang protokol
   sendiri. Versi dipatok (`^1.2.11`) karena endpoint dan token saling terikat.
2. **`/api/tts` adalah satu-satunya sumber audio bahasa Jerman.** Web Speech API hanya jaring
   keselamatan saat permintaan gagal, dan **tidak boleh memanipulasi pitch**. Mengubah nada suara yang
   sama bukan pengganti persona; ia menyamarkan kegagalan jaringan sebagai "persona yang mirip".
3. **Unit yang diseberangkan antar komponen adalah `personaId`, bukan `gender`.** `gender` hanya
   dipertahankan untuk data dialog hasil AI yang tidak membawa identitas persona. Prioritasnya
   dinyatakan di satu fungsi murni `resolveTtsRequest`: persona eksplisit > persona tersimpan yang
   gender-nya cocok > persona default untuk gender itu. Tidak ada jalur kedua yang boleh memilih suara.
4. **Kerusakan endpoint dideteksi lewat `npm run tts:smoke`, bukan lewat laporan pengguna.** Test unit
   `tts.test.ts` memock `ttsPromise`, jadi transport tidak pernah diuji; skrip smoke menyintesis keenam
   suara dan keluar dengan kode 1 bila ada yang gagal. Sengaja tidak masuk CI karena memanggil layanan
   pihak ketiga dan bergantung jaringan.
5. **Self-hosting TTS open source ditolak untuk sekarang.** Piper sudah pindah ke `OHF-Voice/piper1-gpl`
   dan berlisensi **GPLv3** sejak 1.3.0 (`rhasspy/piper` diarsipkan), sementara Kokoro German
   (`r1di/kokoro-fastapi-german`) hanya menyediakan **dua** suara (`dm_bernd`, `df_eva`) dari model yang
   model card-nya sendiri menyatakan masih kurang latihan. Keduanya menurunkan jumlah persona di bawah
   enam yang diwajibkan ADR-0003 dan menambah runtime Python di lingkungan serverless. Ditinjau ulang
   bila endpoint Microsoft gagal dua kali dalam satu siklus rilis, atau bila kebutuhan persona berubah.

Konsekuensi:

- Enam persona kini benar-benar berbeda karena setiap permintaan membawa `voiceId` neural yang eksplisit.
- Aplikasi masih bergantung pada layanan gratis tanpa SLA, dan token `Sec-MS-GEC` menolak koneksi bila
  jam server melenceng. `npm run tts:smoke` adalah deteksi termurah yang tersedia untuk itu.
- Fallback browser tetap ada, tetapi sengaja "bodoh": satu suara lokal, pitch 1.0, disertai
  `console.warn`. Pengguna tidak diberi ilusi persona saat jaringan gagal.
