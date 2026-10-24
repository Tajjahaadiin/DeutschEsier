#!/usr/bin/env python3
import os
import re
import subprocess

# Ekstrak seluruh kata dari src/db/seed.ts
SEED_FILE = "src/db/seed.ts"
OUTPUT_DIR = "public/audio/words"
os.makedirs(OUTPUT_DIR, exist_ok=True)

THORSTEN_MODEL = "/tmp/piper_voices/de_DE-thorsten-medium.onnx"
PIPER_BIN = "/home/tajjz/.local/bin/piper"

with open(SEED_FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Regex tangkap { germanWord: '...', article: '...', indonesianWord: '...' }
pattern = re.compile(r"germanWord:\s*'([^']+)',\s*article:\s*'([^']+)'")
matches = pattern.findall(content)

print(f"Ditemukan {len(matches)} kata kognat dari seed database.")
print(f"Men-generate audio Martin (Thorsten) ke {OUTPUT_DIR}...")

for idx, (german_word, article) in enumerate(matches):
    full_text = f"{article} {german_word}"
    slug = f"{article}-{german_word.lower().replace(' ', '-')}"
    output_path = os.path.join(OUTPUT_DIR, f"{slug}.wav")

    # Jalankan piper TTS
    cmd = f'echo "{full_text}" | {PIPER_BIN} -m {THORSTEN_MODEL} -f "{output_path}"'
    subprocess.run(cmd, shell=True, check=True)

    if (idx + 1) % 15 == 0 or idx + 1 == len(matches):
        print(f"[{idx+1}/{len(matches)}] Selesai: {full_text} -> {slug}.wav")

print("Seluruh audio Bank Kata Martin berhasil di-generate!")
