#!/usr/bin/env python3
import os
import re
import soundfile as sf
from kokoro_onnx import Kokoro

MODEL_PATH = '/tmp/kokoro_models/kokoro-martin.onnx'
VOICES_PATH = '/tmp/kokoro_models/voices-martin.npz'

print("Inisialisasi Kokoro-ONNX German Martin...")
kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
print("Kokoro siap!")

def synth_and_save(text: str, out_path: str):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    samples, sr = kokoro.create(text.strip(), voice='martin', speed=1.0, lang='de')
    sf.write(out_path, samples, sr)

# ==========================================
# 1. GENERATE BANK KATA (104 KATA)
# ==========================================
print("\n=== 1. MEN-GENERATE BANK KATA (KOKORO MARTIN) ===")
SEED_FILE = "src/db/seed.ts"
WORDS_DIR = "public/audio/words"

with open(SEED_FILE, "r", encoding="utf-8") as f:
    content = f.read()

pattern = re.compile(r"germanWord:\s*'([^']+)',\s*article:\s*'([^']+)'")
matches = pattern.findall(content)
print(f"Total kata: {len(matches)}")

for idx, (german_word, article) in enumerate(matches):
    full_text = f"{article} {german_word}"
    slug = f"{article}-{german_word.lower().replace(' ', '-')}"
    out_path = os.path.join(WORDS_DIR, f"{slug}.wav")
    synth_and_save(full_text, out_path)
    if (idx + 1) % 25 == 0 or idx + 1 == len(matches):
        print(f"[{idx+1}/{len(matches)}] Selesai: {full_text} -> {slug}.wav")

# ==========================================
# 2. GENERATE KARTU ALFABET (30 HURUF x 2)
# ==========================================
print("\n=== 2. MEN-GENERATE KARTU ALFABET (KOKORO MARTIN) ===")
ALPHABET_DIR = "public/audio/alphabet"

ALPHABET_DATA = [
    ("a", "A", "das Auto"),
    ("b", "Be", "das Buch"),
    ("c", "Tse", "das Café"),
    ("d", "De", "Danke"),
    ("e", "E", "der Elefant"),
    ("f", "Ef", "die Familie"),
    ("g", "Ge", "die Gitarre"),
    ("h", "Ha", "das Hotel"),
    ("i", "I", "die Idee"),
    ("j", "Jot", "die Jacke"),
    ("k", "Ka", "der Kaffee"),
    ("l", "El", "die Lampe"),
    ("m", "Em", "die Musik"),
    ("n", "En", "der Name"),
    ("o", "O", "die Orange"),
    ("p", "Pe", "der Pass"),
    ("q", "Ku", "die Quittung"),
    ("r", "Er", "das Radio"),
    ("s", "Es", "die Sonne"),
    ("t", "Te", "der Tee"),
    ("u", "U", "die Uhr"),
    ("v", "Vau", "der Vater"),
    ("w", "We", "das Wasser"),
    ("x", "Ix", "das Xylofon"),
    ("y", "Ypsilon", "das Yoga"),
    ("z", "Zett", "der Zug"),
    ("ae", "Ä", "die Äpfel"),
    ("oe", "Ö", "das Öl"),
    ("ue", "Ü", "die Übung"),
    ("ss", "Eszett", "die Straße"),
]

for idx, (item_id, letter_text, word_text) in enumerate(ALPHABET_DATA):
    letter_path = os.path.join(ALPHABET_DIR, f"{item_id}-letter.wav")
    word_path = os.path.join(ALPHABET_DIR, f"{item_id}-word.wav")
    synth_and_save(letter_text, letter_path)
    synth_and_save(word_text, word_path)
    if (idx + 1) % 10 == 0 or idx + 1 == len(ALPHABET_DATA):
        print(f"[{idx+1}/{len(ALPHABET_DATA)}] Selesai: {letter_text} & {word_text}")

# ==========================================
# 3. GENERATE KARTU ANGKA & GAME HITUNG
# ==========================================
print("\n=== 3. MEN-GENERATE DIE NUMMER & GAME HITUNG (KOKORO MARTIN) ===")
NUMBERS_DIR = "public/audio/numbers"
GAME_DIR = "public/audio/number-game"

NUMBERS = [
    (0, "null"), (1, "eins"), (2, "zwei"), (3, "drei"), (4, "vier"), (5, "fünf"),
    (6, "sechs"), (7, "sieben"), (8, "acht"), (9, "neun"), (10, "zehn"), (11, "elf"),
    (12, "zwölf"), (13, "dreizehn"), (14, "vierzehn"), (15, "fünfzehn"), (16, "sechzehn"),
    (17, "siebzehn"), (18, "achtzehn"), (19, "neunzehn"), (20, "zwanzig"), (30, "dreißig"),
    (40, "vierzig"), (50, "fünfzig"), (60, "sechzig"), (70, "siebzig"), (80, "achtzig"),
    (90, "neunzig"), (100, "hundert"), (1000, "eintausend"), (10000, "zehntausend"),
    (1000000, "eine Million"),
]

for val, txt in NUMBERS:
    synth_and_save(txt, os.path.join(NUMBERS_DIR, f"{val}.wav"))
print(f"Selesai 32 audio kartu angka.")

# 24 Benda Game Hitung
NOUNS = [
    ("Tomate", "Tomaten", "die"), ("Apfel", "Äpfel", "der"), ("Banane", "Bananen", "die"),
    ("Orange", "Orangen", "die"), ("Brot", "Brote", "das"), ("Ei", "Eier", "das"),
    ("Kartoffel", "Kartoffeln", "die"), ("Käse", "Käse", "der"), ("Zitrone", "Zitronen", "die"),
    ("Karotte", "Karotten", "die"), ("Kuchen", "Kuchen", "der"), ("Wasser", "Wasser", "das"),
    ("Glas", "Gläser", "das"), ("Tasse", "Tassen", "die"), ("Teller", "Teller", "der"),
    ("Flasche", "Flaschen", "die"), ("Buch", "Bücher", "das"), ("Stuhl", "Stühle", "der"),
    ("Lampe", "Lampen", "die"), ("Schlüssel", "Schlüssel", "der"), ("Stift", "Stifte", "der"),
    ("Heft", "Hefte", "das"), ("Blume", "Blumen", "die"), ("Ball", "Bälle", "der")
]

UNITS_WORDS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"]

for n in range(1, 11):
    for noun, plural, article in NOUNS:
        if n == 1:
            indef = "eine" if article == "die" else "ein"
            phrase = f"{indef} {noun}"
        else:
            phrase = f"{UNITS_WORDS[n]} {plural}"
        slug = f"{n}-{noun.lower()}"
        synth_and_save(phrase, os.path.join(GAME_DIR, f"{slug}.wav"))
    print(f"Selesai kombinasi game untuk angka {n} (24 benda)...")

# ==========================================
# 4. GENERATE DIE TAGE (33 ITEM)
# ==========================================
print("\n=== 4. MEN-GENERATE DIE TAGE (KOKORO MARTIN) ===")
DAYS_DIR = "public/audio/days"

CALENDAR_ITEMS = [
    # Hari
    ("montag", "Montag"), ("dienstag", "Dienstag"), ("mittwoch", "Mittwoch"),
    ("donnerstag", "Donnerstag"), ("freitag", "Freitag"), ("samstag", "Samstag"), ("sonntag", "Sonntag"),
    # Bulan
    ("januar", "Januar"), ("februar", "Februar"), ("maerz", "März"), ("april", "April"),
    ("mai", "Mai"), ("juni", "Juni"), ("juli", "Juli"), ("august", "August"),
    ("september", "September"), ("oktober", "Oktober"), ("november", "November"), ("dezember", "Dezember"),
    # Waktu
    ("heute", "heute"), ("morgen", "morgen"), ("gestern", "gestern"),
    ("uebermorgen", "übermorgen"), ("vorgestern", "vorgestern"),
    ("das-wochenende", "das Wochenende"), ("die-woche", "die Woche"),
    ("der-monat", "der Monat"), ("das-jahr", "das Jahr"),
    # Hari Libur
    ("neujahr", "Neujahr"), ("tag-der-arbeit", "Tag der Arbeit"),
    ("tag-der-deutschen-einheit", "Tag der Deutschen Einheit"),
    ("weihnachten", "Weihnachten"), ("zweiter-weihnachtstag", "Zweiter Weihnachtstag"),
]

for slug, text in CALENDAR_ITEMS:
    synth_and_save(text, os.path.join(DAYS_DIR, f"{slug}.wav"))
print(f"Selesai 33 audio die Tage.")

print("\n🎉 SEMUA ASET PRE-GENERATED SUDAH 100% DI-GENERATE DENGAN KOKORO MARTIN (KIKIRI-TTS)! 🎉")
