import React, { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import GeneratorPage from './pages/GeneratorPage'
import ViewPage from './pages/ViewPage'
import AlphabetPage from './pages/AlphabetPage'
import LoginPage from './pages/LoginPage'
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

  // Route: /login
  if (currentPath === '/login') {
    if (isTeacherAuthenticated()) {
      return <HomePage navigate={navigate} />
    }
    return <LoginPage navigate={navigate} />
  }

  // Route: /view/:id (Accessible to anyone: teacher or student)
  if (currentPath.startsWith('/view/')) {
    const id = currentPath.split('/view/')[1].split('?')[0]
    return <ViewPage id={id} navigate={navigate} />
  }

  // Route guarding for teacher routes
  const isProtectedTeacherRoute =
    currentPath === '/' ||
    currentPath === '/alphabet' ||
    currentPath === '/generate' ||
    currentPath.startsWith('/edit/')

  if (isProtectedTeacherRoute && !isTeacherAuthenticated()) {
    return <LoginPage navigate={navigate} />
  }

  if (currentPath === '/') {
    return <HomePage navigate={navigate} />
  }

  if (currentPath === '/alphabet') {
    return <AlphabetPage navigate={navigate} />
  }

  if (currentPath === '/generate') {
    return <GeneratorPage navigate={navigate} />
  }

  if (currentPath.startsWith('/edit/')) {
    const id = currentPath.split('/edit/')[1].split('?')[0]
    return <GeneratorPage editId={id} navigate={navigate} />
  }

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">404 Not Found</h1>
      <button onClick={() => navigate('/')} className="text-blue-500 hover:underline mt-4">Go Home</button>
    </div>
  )
}
