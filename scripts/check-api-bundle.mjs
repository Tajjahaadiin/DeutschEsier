/**
 * Guard untuk mencegah insiden deployment: api/index.js harus ada DAN harus
 * ikut ter-commit ke git.
 *
 * Latar belakang: api/index.js sempat dimasukkan ke .gitignore. Vercel
 * menghormati .gitignore saat menentukan berkas mana yang di-deploy, sehingga
 * serverless function tidak pernah ikut ter-deploy. Akibatnya seluruh
 * /api/* jatuh ke SPA fallback dan mengembalikan index.html
 * (POST -> 405 Method Not Allowed, GET -> HTML bukan JSON), yang di klien
 * muncul sebagai "Unexpected end of JSON input".
 *
 * Skrip ini dijalankan otomatis lewat hook `postbuild`.
 */
import { existsSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'

const BUNDLE = 'api/index.js'
const MIN_BYTES = 100_000 // bundle normal ~1.2 MB; jauh di bawah ini berarti gagal build

function fail(message, hint) {
  console.error('\n[check-api-bundle] GAGAL: ' + message)
  if (hint) console.error('  ' + hint)
  console.error('')
  process.exit(1)
}

// 1. Berkas harus ada
if (!existsSync(BUNDLE)) {
  fail(
    `${BUNDLE} tidak ditemukan.`,
    'Jalankan: npm run build:api'
  )
}

// 2. Berkas harus berisi (bukan kosong/terpotong)
const size = statSync(BUNDLE).size
if (size < MIN_BYTES) {
  fail(
    `${BUNDLE} hanya ${size} byte (diharapkan > ${MIN_BYTES}).`,
    'Bundle kemungkinan gagal di-build. Jalankan ulang: npm run build:api'
  )
}

// 3. Berkas harus IKUT TER-COMMIT, bukan di-ignore
//    Inilah akar insiden: bundle ada di disk tapi tidak ter-deploy.
//    `--no-index` wajib: tanpa itu git check-ignore melewatkan berkas yang
//    sudah ter-track, sehingga entri .gitignore yang ditambahkan belakangan
//    (persis kasus insiden ini) tidak terdeteksi.
function isIgnoredByGit(file) {
  try {
    const out = execSync(`git check-ignore --no-index ${file}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.toString().trim() !== ''
  } catch {
    // exit code 1 = tidak ter-ignore (kondisi yang diinginkan)
    return false
  }
}

if (isIgnoredByGit(BUNDLE)) {
  fail(
    `${BUNDLE} diabaikan oleh git, sehingga TIDAK akan ikut ter-deploy ke Vercel.`,
    'Hapus entri api/index.js dari .gitignore lalu `git add api/index.js`.'
  )
}

// 4. Berkas harus benar-benar ter-track oleh git (bukan hanya ada di disk)
function isTrackedByGit(file) {
  try {
    const out = execSync(`git ls-files --error-unmatch ${file}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.toString().trim() !== ''
  } catch {
    return false
  }
}

if (!isTrackedByGit(BUNDLE)) {
  fail(
    `${BUNDLE} ada di disk tetapi BELUM ter-track git, jadi tidak akan ter-deploy.`,
    `Jalankan: git add ${BUNDLE}`
  )
}

console.log(`[check-api-bundle] OK - ${BUNDLE} (${(size / 1024 / 1024).toFixed(2)} MB) ada dan ter-commit`)
