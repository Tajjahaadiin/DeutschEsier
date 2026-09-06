# Scripts

## generate-audio.sh
Generate MP3 audio files untuk 105 cognate words menggunakan German TTS (espeak).

**Prasyarat:**
```bash
sudo apt-get install espeak lame
```

**Jalankan:**
```bash
bash scripts/generate-audio.sh
```

File MP3 akan tersimpan di `public/audio/`. Web Speech API (de-DE) digunakan sebagai fallback otomatis di browser jika file MP3 tidak tersedia.
