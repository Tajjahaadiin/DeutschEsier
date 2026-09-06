const TEACHER_TOKEN_KEY = 'teacher_auth_token'

export function getTeacherToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TEACHER_TOKEN_KEY)
}

export function isTeacherAuthenticated(): boolean {
  return !!getTeacherToken()
}

export async function loginTeacher(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      return { success: false, error: data.error || 'Login gagal' }
    }
    if (data.token) {
      localStorage.setItem(TEACHER_TOKEN_KEY, data.token)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'))
      }
      return { success: true }
    }
    return { success: false, error: 'Token tidak valid' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghubungi server' }
  }
}

export function logoutTeacher(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TEACHER_TOKEN_KEY)
    window.dispatchEvent(new Event('auth-change'))
    window.location.href = '/login'
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getTeacherToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}
