#!/usr/bin/env python3
import os
import subprocess
import sys

AUDIO_DIR = "public/audio"
SUBDIRS = ["alphabet", "days", "number-game", "numbers", "words"]

print("=== MEMULAI KONVERSI BATCH WAV KE MP3 ===")
converted = 0
failed = 0

for sub in SUBDIRS:
    dir_path = os.path.join(AUDIO_DIR, sub)
    if not os.path.isdir(dir_path):
        continue
    
    files = [f for f in os.listdir(dir_path) if f.endswith(".wav")]
    print(f"\nFolder '{sub}': {len(files)} file WAV...")

    for f in files:
        wav_path = os.path.join(dir_path, f)
        mp3_name = f[:-4] + ".mp3"
        mp3_path = os.path.join(dir_path, mp3_name)

        # ffmpeg convert ke MP3 64k mono 24000Hz (ukuran sangat kecil ~5-10 KB, suara jernih)
        cmd = [
            "ffmpeg", "-y", "-nostdin", "-hide_banner", "-v", "error",
            "-i", wav_path,
            "-c:a", "libmp3lame",
            "-b:a", "64k",
            "-ar", "24000",
            "-ac", "1",
            mp3_path
        ]
        res = subprocess.run(cmd)
        if res.returncode == 0:
            converted += 1
            # Hapus file WAV asli setelah sukses konversi
            os.remove(wav_path)
        else:
            failed += 1
            print(f"Gagal konversi: {wav_path}", file=sys.stderr)

print(f"\n=== SELESAI: {converted} file dikonversi ke MP3 & WAV dihapus, {failed} gagal. ===")
