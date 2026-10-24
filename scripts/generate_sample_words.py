#!/usr/bin/env python3
import os
import subprocess

TEST_WORDS = [
    {"de": "Die Lampe", "id": "Lampu"},
    {"de": "Der Kaffee", "id": "Kopi"},
    {"de": "Das Brot", "id": "Roti"},
    {"de": "Die Apotheke", "id": "Apotek"},
    {"de": "Guten Tag! Wie geht es Ihnen?", "id": "Selamat siang! Apa kabar?"},
]

OUTPUT_DIR = "public/audio/test-preview"
os.makedirs(OUTPUT_DIR, exist_ok=True)

THORSTEN_MODEL = "/tmp/piper_voices/de_DE-thorsten-medium.onnx"
KERSTIN_MODEL = "/tmp/piper_voices/de_DE-kerstin-low.onnx"
PIPER_BIN = "/home/tajjz/.local/bin/piper"

print(f"Generating test audio files to {OUTPUT_DIR}...")

for idx, item in enumerate(TEST_WORDS):
    slug = item["de"].lower().replace(" ", "-").replace("!", "").replace("?", "")
    
    # 1. Generate Martin / Thorsten (Pria Bariton)
    male_out = os.path.join(OUTPUT_DIR, f"{slug}-male.wav")
    cmd_m = f'echo "{item["de"]}" | {PIPER_BIN} -m {THORSTEN_MODEL} -f {male_out}'
    subprocess.run(cmd_m, shell=True, check=True)
    
    # 2. Generate Victoria / Kerstin (Wanita Artikulatif)
    female_out = os.path.join(OUTPUT_DIR, f"{slug}-female.wav")
    cmd_f = f'echo "{item["de"]}" | {PIPER_BIN} -m {KERSTIN_MODEL} -f {female_out}'
    subprocess.run(cmd_f, shell=True, check=True)
    
    print(f"[{idx+1}/{len(TEST_WORDS)}] OK: {item['de']} -> {slug}-male.wav & {slug}-female.wav")

print("All test samples generated successfully!")
