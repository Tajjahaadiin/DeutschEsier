import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import GrundlagenPage from './pages/GrundlagenPage'
import AudioPrototypePage from './pages/AudioPrototypePage'
import GeneratorPage from './pages/GeneratorPage'
import ViewPage from './pages/ViewPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import { initGermanVoice } from './lib/audio'
import { isTeacherAuthenticated } from './lib/auth'

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [, setAuthVersion] = useState(0)

  useEffect(() => {
    initGermanVoice()

    const handlePopState = () => setCurrentPath(window.location.pathname)
    const handleAuthChange = () => setAuthVersion((v) => v + 1)

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('auth-change', handleAuthChange)
    window.addEventListener('storage', handleAuthChange)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('auth-change', handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path.split('?')[0])
  }

  // 1. Rute Publik: /login
  if (currentPath === '/login') {
    if (isTeacherAuthenticated()) {
      return (
        <DashboardLayout currentPath="/" navigate={navigate}>
          <HomePage navigate={navigate} />
        </DashboardLayout>
      )
    }
    return <LoginPage navigate={navigate} />
  }

  // 2. Rute Publik: /view/:id (Ruang Belajar Percakapan Siswa/Guru)
  if (currentPath.startsWith('/view/')) {
    const id = currentPath.split('/view/')[1].split('?')[0]
    return <ViewPage id={id} navigate={navigate} />
  }

  // Rute Prototype Audio: /prototype-audio
  if (currentPath === '/prototype-audio') {
    return <AudioPrototypePage navigate={navigate} />
  }

  // 3. Rute Terbuka Guru & Murid: /grundlagen (Portal Modul Fondasi Dasar)
  if (currentPath === '/grundlagen') {
    const page = <GrundlagenPage navigate={navigate} />
    return isTeacherAuthenticated() ? (
      <DashboardLayout currentPath={currentPath} navigate={navigate}>
        {page}
      </DashboardLayout>
    ) : (
      <div className="min-h-dvh bg-neutral p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {page}
      </div>
    )
  }

  // 4. Backward-Compatibility Redirects: /alphabet, /nummer, /tage -> /grundlagen?tab=...
  if (currentPath === '/alphabet') {
    const page = <GrundlagenPage navigate={navigate} initialTab="alphabet" />
    return isTeacherAuthenticated() ? (
      <DashboardLayout currentPath="/grundlagen" navigate={navigate}>
        {page}
      </DashboardLayout>
    ) : (
      <div className="min-h-dvh bg-neutral p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {page}
      </div>
    )
  }

  if (currentPath === '/nummer') {
    const page = <GrundlagenPage navigate={navigate} initialTab="nummer" />
    return isTeacherAuthenticated() ? (
      <DashboardLayout currentPath="/grundlagen" navigate={navigate}>
        {page}
      </DashboardLayout>
    ) : (
      <div className="min-h-dvh bg-neutral p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {page}
      </div>
    )
  }

  if (currentPath === '/tage') {
    const page = <GrundlagenPage navigate={navigate} initialTab="tage" />
    return isTeacherAuthenticated() ? (
      <DashboardLayout currentPath="/grundlagen" navigate={navigate}>
        {page}
      </DashboardLayout>
    ) : (
      <div className="min-h-dvh bg-neutral p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {page}
      </div>
    )
  }

  // 5. Rute Terlindungi Khusus Guru
  const isProtectedTeacherRoute =
    currentPath === '/' ||
    currentPath === '/generate' ||
    currentPath.startsWith('/edit/')

  if (isProtectedTeacherRoute && !isTeacherAuthenticated()) {
    return <LoginPage navigate={navigate} />
  }

  if (currentPath === '/') {
    return (
      <DashboardLayout currentPath={currentPath} navigate={navigate}>
        <HomePage navigate={navigate} />
      </DashboardLayout>
    )
  }

  if (currentPath === '/generate') {
    return (
      <DashboardLayout currentPath={currentPath} navigate={navigate}>
        <GeneratorPage navigate={navigate} />
      </DashboardLayout>
    )
  }

  if (currentPath.startsWith('/edit/')) {
    const id = currentPath.split('/edit/')[1].split('?')[0]
    return (
      <DashboardLayout currentPath={currentPath} navigate={navigate}>
        <GeneratorPage editId={id} navigate={navigate} />
      </DashboardLayout>
    )
  }

  // 6. 404 Fallback
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8 text-center bg-neutral">
      <h1 className="text-display font-bold text-text">404 Not Found</h1>
      <p className="text-body-sm text-text-muted mt-2">Halaman yang Anda tuju tidak ditemukan.</p>
      <button
        onClick={() => navigate('/')}
        className="mt-4 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
      >
        Kembali ke Beranda
      </button>
    </div>
  )
}
