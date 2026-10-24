import { GoogleGenAI } from '@google/genai'
import { wrapPcmInWav } from './wavHeader'
import { resolveGeminiVoiceName } from '../../shared/ttsPersonas'

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Mensintesis teks bahasa Jerman menjadi buffer audio WAV (24kHz, 16-bit, mono)
 * menggunakan model Gemini 2.5 Flash TTS dengan 6 pilihan prebuilt voice.
 */
export async function synthesizeGeminiSpeech(text: string, personaOrVoice?: string): Promise<Buffer> {
  const voiceName = resolveGeminiVoiceName(personaOrVoice)
  const ai = getAiClient()

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [
      {
        parts: [
          {
            text: `Say in standard German (Hochdeutsch): ${text}`,
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  })

  const base64Pcm = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  if (!base64Pcm) {
    throw new Error('Gemini TTS returned empty audio payload')
  }

  const pcmBuffer = Buffer.from(base64Pcm, 'base64')
  return wrapPcmInWav(pcmBuffer, 24000, 1, 16)
}
