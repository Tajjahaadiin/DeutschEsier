#!/bin/bash
# Script generate placeholder audio (German TTS) menggunakan espeak + lame
# Prasyarat: sudo apt-get install espeak lame
# Jalankan: bash scripts/generate-audio.sh

AUDIO_DIR="./public/audio"
mkdir -p "$AUDIO_DIR"

declare -A WORDS=(
  ["lampe"]="Lampe" ["kammer"]="Kammer" ["glas"]="Glas" ["eimer"]="Eimer"
  ["handtuch"]="Handtuch" ["tasche"]="Tasche" ["sofa"]="Sofa" ["matratze"]="Matratze"
  ["kessel"]="Kessel" ["kabel"]="Kabel" ["schalter"]="Schalter" ["steckdose"]="Steckdose"
  ["schraube"]="Schraube" ["bohrer"]="Bohrer" ["zange"]="Zange"
  ["kaffee"]="Kaffee" ["tee"]="Tee" ["bier"]="Bier" ["schokolade"]="Schokolade"
  ["tomate"]="Tomate" ["vanille"]="Vanille" ["salat"]="Salat" ["suppe"]="Suppe"
  ["sauce"]="Sauce" ["bonbon"]="Bonbon" ["sirup"]="Sirup" ["mayonnaise"]="Mayonnaise"
  ["pasta"]="Pasta" ["steak"]="Steak" ["zitrone"]="Zitrone"
  ["apotheke"]="Apotheke" ["doktor"]="Doktor" ["patient"]="Patient"
  ["operation"]="Operation" ["pflaster"]="Pflaster" ["verband"]="Verband"
  ["rezept"]="Rezept" ["pille"]="Pille" ["tablette"]="Tablette" ["kapsel"]="Kapsel"
  ["klinik"]="Klinik" ["virus"]="Virus" ["bakterie"]="Bakterie" ["organ"]="Organ"
  ["fabrik"]="Fabrik" ["post"]="Post" ["bank"]="Bank" ["station"]="Station"
  ["museum"]="Museum" ["theater"]="Theater" ["hotel"]="Hotel" ["restaurant"]="Restaurant"
  ["balkon"]="Balkon" ["terrasse"]="Terrasse" ["korridor"]="Korridor"
  ["toilette"]="Toilette" ["institut"]="Institut"
  ["schule"]="Schule" ["buch"]="Buch" ["alphabet"]="Alphabet" ["text"]="Text"
  ["problem"]="Problem" ["methode"]="Methode" ["system"]="System"
  ["theorie"]="Theorie" ["experiment"]="Experiment" ["projekt"]="Projekt"
  ["biologie"]="Biologie" ["physik"]="Physik" ["musik"]="Musik"
  ["gitarre"]="Gitarre" ["klavier"]="Klavier" ["trompete"]="Trompete"
  ["formular"]="Formular" ["akte"]="Akte" ["dokument"]="Dokument"
  ["karte"]="Karte" ["nummer"]="Nummer" ["datum"]="Datum" ["protokoll"]="Protokoll"
  ["prozent"]="Prozent" ["kasse"]="Kasse" ["saldo"]="Saldo" ["bankrott"]="Bankrott"
  ["tarif"]="Tarif" ["garantie"]="Garantie" ["gratis"]="Gratis"
  ["pension"]="Pension" ["kurs"]="Kurs"
  ["auto"]="Auto" ["bus"]="Bus" ["motor"]="Motor" ["bremse"]="Bremse" ["schaufel"]="Schaufel"
  ["familie"]="Familie" ["telefon"]="Telefon" ["radio"]="Radio" ["politik"]="Politik"
)

echo "Generating ${#WORDS[@]} audio files..."
for key in "${!WORDS[@]}"; do
  OUTFILE="$AUDIO_DIR/${key}.mp3"
  [ -f "$OUTFILE" ] && echo "  Skip: ${key}.mp3" && continue
  if espeak -v de -s 130 -z "${WORDS[$key]}" -w /tmp/_de_${key}.wav 2>/dev/null && \
     lame --quiet /tmp/_de_${key}.wav "$OUTFILE" 2>/dev/null; then
    echo "  OK: ${key}.mp3"
  else
    echo "  FAIL: ${key}.mp3 (espeak/lame tidak tersedia?)"
  fi
  rm -f /tmp/_de_${key}.wav
done
echo "Done!"
