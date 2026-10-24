/**
 * Utilitas pembungkus Raw PCM 16-bit ke format standar WAV (RIFF header 44-byte).
 * Menggunakan Node.js Buffer native tanpa dependensi eksternal.
 *
 * ponytail: Pembungkus WAV header 44-byte untuk format PCM 16-bit standar.
 * Upgrade path: Dukungan streaming chunked bila ukuran audio lebih dari 10MB.
 */

export function wrapPcmInWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = pcmBuffer.length
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4) // File size - 8
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // Subchunk1Size (16 untuk PCM)
  header.writeUInt16LE(1, 20) // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcmBuffer])
}
