#!/usr/bin/env python3
import os
import subprocess
import soundfile as sf
from kokoro_onnx import Kokoro

MODEL_PATH = '/tmp/kokoro_models/kokoro-martin.onnx'
VOICES_PATH = '/tmp/kokoro_models/voices-martin.npz'
DAYS_DIR = 'public/audio/days'
os.makedirs(DAYS_DIR, exist_ok=True)

print("Inisialisasi Kokoro-ONNX German Martin...")
kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

# Daftar angka ordinal Jerman 1 s.d. 31 (der erste, der zweite, ..., der einunddreißigste)
ORDINALS = {
    1: "der erste",
    2: "der zweite",
    3: "der dritte",
    4: "der vierte",
    5: "der fünfte",
    6: "der sechste",
    7: "der siebte",
    8: "der achte",
    9: "der neunte",
    10: "der zehnte",
    11: "der elfte",
    12: "der zwölfte",
    13: "der dreizehnte",
    14: "der vierzehnte",
    15: "der fünfzehnte",
    16: "der sechzehnte",
    17: "der siebzehnte",
    18: "der achtzehnte",
    19: "der neunzehnte",
    20: "der zwanzigste",
    21: "der einundzwanzigste",
    22: "der zweiundzwanzigste",
    23: "der dreiundzwanzigste",
    24: "der vierundzwanzigste",
    25: "der fünfundzwanzigste",
    26: "der sechsundzwanzigste",
    27: "der siebenundzwanzigste",
    28: "der achtundzwanzigste",
    29: "der neunundzwanzigste",
    30: "der dreißigste",
    31: "der einunddreißigste",
}

print(f"\n=== GENERATE 31 AUDIO ORDINAL TANGGAL (KOKORO MARTIN) ===")

for day, phrase in ORDINALS.items():
    wav_path = f"/tmp/ordinal_{day}.wav"
    mp3_path = os.path.join(DAYS_DIR, f"tag-{day}.mp3")

    # 1. Sintesis via Kokoro Martin
    samples, sr = kokoro.create(phrase, voice='martin', speed=1.0, lang='de')
    sf.write(wav_path, samples, sr)

    # 2. Kompresi langsung ke MP3 64k mono
    cmd = [
        "ffmpeg", "-y", "-nostdin", "-hide_banner", "-v", "error",
        "-i", wav_path,
        "-c:a", "libmp3lame",
        "-b:a", "64k",
        "-ar", "24000",
        "-ac", "1",
        mp3_path
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(wav_path):
        os.remove(wav_path)
    
    print(f"[{day}/31] {phrase} -> tag-{day}.mp3 ({os.path.getsize(mp3_path)} bytes)")

print("\n🎉 SEMUA 31 AUDIO ORDINAL KALENDER SUDAH SIAP! 🎉")
