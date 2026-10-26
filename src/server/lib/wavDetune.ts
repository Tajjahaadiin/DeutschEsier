/**
 * Mengubah pitch/detune file audio WAV secara instan dengan memodulasi header SampleRate & ByteRate (44-byte RIFF).
 * Cara ini murni matematis (0 overhead CPU, 0 dependensi tambahan, < 1ms eksekusi).
 *
 * Contoh:
 * - detuneSemis = -2.0 -> Frekuensi turun 2 semitone (Vokal Bariton pria dewasa, lebih berat & maskulin).
 * - detuneSemis = +1.8 -> Frekuensi naik 1.8 semitone (Vokal Tenor pria muda, lebih ringan & energik).
 */
export function detuneWavBuffer(wavBuffer: Buffer, semitones: number): Buffer {
  if (semitones === 0 || wavBuffer.length < 44) return wavBuffer

  // Pastikan formatnya adalah WAV RIFF yang valid
  if (wavBuffer.subarray(0, 4).toString('ascii') !== 'RIFF' || wavBuffer.subarray(8, 12).toString('ascii') !== 'WAVE') {
    return wavBuffer
  }

  // Clone buffer agar tidak memutasi buffer asli
  const modified = Buffer.from(wavBuffer)

  // Baca sampleRate dan byteRate asli dari header WAV (offset 24 & 28)
  const originalSampleRate = modified.readUInt32LE(24)
  const originalByteRate = modified.readUInt32LE(28)

  // Hitung faktor perubahan pitch (2 ^ (n / 12))
  const factor = Math.pow(2.0, semitones / 12.0)
  const newSampleRate = Math.round(originalSampleRate * factor)
  const newByteRate = Math.round(originalByteRate * factor)

  // Tuliskan kembali ke header WAV
  modified.writeUInt32LE(newSampleRate, 24)
  modified.writeUInt32LE(newByteRate, 28)

  return modified
}
