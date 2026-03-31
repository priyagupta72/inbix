import { getToken, getRefreshToken, saveAuth, clearAuth, getUser  } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Refresh access token silently ──────────────────────
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
  // Prevent multiple simultaneous refresh calls
  if (isRefreshing) return refreshPromise

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return null

      const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) {
        clearAuth()
        window.location.href = '/signin'
        return null
      }

      const data = await res.json()
      const newAccessToken = data.data.accessToken

      // Update stored token (keep same refresh token + user)
      saveAuth(newAccessToken, refreshToken, getUser())

      return newAccessToken
    } catch {
      clearAuth()
      window.location.href = '/signin'
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ── Main fetch wrapper ─────────────────────────────────
export const apiFetch = async (path: string, options: RequestInit = {}) => {
  let token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // ── Auto refresh on 401 ────────────────────────────
  if (res.status === 401) {
    token = await refreshAccessToken()

    if (!token) {
      throw new Error('Session expired. Please login again.')
    }

    // Retry original request with new token
    const retryRes = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!retryRes.ok) {
      const err = await retryRes.json().catch(() => ({}))
      throw new Error(err.message || `Request failed: ${retryRes.status}`)
    }

    return retryRes.json()
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed: ${res.status}`)
  }

  return res.json()
}