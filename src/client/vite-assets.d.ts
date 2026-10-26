/**
 * Deklarasi tipe untuk import aset sebagai URL (Vite `?url`).
 * Worker AudioWorklet di @soundtouchjs dimuat lewat jalur ini.
 */
declare module '*?url' {
  const src: string
  export default src
}
