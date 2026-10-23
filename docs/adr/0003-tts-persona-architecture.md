# 0003. Arsitektur Multi-Persona Suara Text-to-Speech (TTS) dan Multi-Speaker Dialog

> **Sebagian digantikan oleh [ADR-0004](0004-tts-endpoint-as-single-source-of-persona.md).**
> Enam persona dan skema `?voice=`/`?persona=` di bawah tetap berlaku. Pustaka `msedge-tts` sudah
> tidak dipakai (diganti `node-edge-tts`), dan aturan "`personaId` adalah unit yang diseberangkan,
> bukan `gender`" ditetapkan di ADR-0004.

Aplikasi DeutschEasier membutuhkan suara Text-to-Speech (TTS) yang alami dan native bagi penutur bahasa Jerman dengan ragam karakter yang terbedakan untuk mendukung simulasi dialog percakapan hingga 4–6 pembicara yang berbeda peran dan usia.

Kami memutuskan:
1. **Menggunakan Microsoft Edge Neural TTS bawaan (`msedge-tts`)** tanpa menambah dependensi pihak ketiga atau API berbayar.
2. **Membakukan 6 persona vokal standar Hochdeutsch**:
   - **`male-1` (Conrad / `de-DE-ConradNeural`)**: Dewasa matang (35–50 th), bariton tegas (*Der Lehrer* / Guru Formal).
   - **`male-2` (Killian / `de-DE-KillianNeural`)**: Muda (20–30 th), tenor santai, luwes (*Der Student* / Mahasiswa Kasual).
   - **`male-3` (Florian / `de-DE-FlorianMultilingualNeural`)**: Dewasa muda (25–35 th), modern, lugas (*Der Kollege* / Rekan Kerja Profesional).
   - **`female-1` (Katja / `de-DE-KatjaNeural`)**: Dewasa (30–45 th), jernih, hangat, artikulatif (*Die Lehrerin* / Tutor Utama).
   - **`female-2` (Amala / `de-DE-AmalaNeural`)**: Muda (18–28 th), ceria, dinamis (*Die Studentin* / Rekan Belajar).
   - **`female-3` (Seraphina / `de-DE-SeraphinaMultilingualNeural`)**: Dewasa muda (25–35 th), ramah, empatik (*Die Beraterin* / Konsultan Ramah).
3. **Mendukung Skenario Multi-Pembicara (2 hingga 6 Karakter)**:
   - Skenario percakapan tidak lagi terkunci hanya pada dua pembicara ("Sprecher A" dan "Sprecher B"), melainkan dapat dikonfigurasi hingga 4–6 pembicara (misal rapat kelompok, diskusi kelas, percakapan di restoran keluarga).
   - Setiap pembicara dipetakan ke satu `personaId` unik sehingga setiap giliran bicara dibacakan oleh karakter vokal yang konsisten.
4. **Memperluas API `/api/tts`** untuk menerima query parameter `?voice=<voiceId>` atau `?persona=<personaId>`, dengan fallback ke mapping gender lama demi backwards-compatibility data lawas, serta mempertahankan caching immutable Vercel Edge CDN (`Cache-Control: public, max-age=31536000, immutable`).
