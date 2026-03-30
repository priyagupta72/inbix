const TOKEN_KEY   = 'token'
const REFRESH_KEY = 'refreshToken'
const USER_KEY    = 'user'

// Safe localStorage helper — returns null on server
const storage = {
  get: (key: string) =>
    typeof window !== 'undefined' ? localStorage.getItem(key) : null,
  set: (key: string, value: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, value)
  },
  remove: (key: string) => {
    if (typeof window !== 'undefined') localStorage.removeItem(key)
  },
}

export const saveAuth = (token: string, refreshToken: string, user: object) => {
  storage.set(TOKEN_KEY,   token)
  storage.set(REFRESH_KEY, refreshToken)
  storage.set(USER_KEY,    JSON.stringify(user))
}

export const getToken = () => storage.get(TOKEN_KEY)

export const getRefreshToken = () => storage.get(REFRESH_KEY)

export const getUser = () => {
  const u = storage.get(USER_KEY)
  return u ? JSON.parse(u) : null
}

export const clearAuth = () => {
  storage.remove(TOKEN_KEY)
  storage.remove(REFRESH_KEY)
  storage.remove(USER_KEY)
}

export const isLoggedIn = () => !!getToken()

export const logout = clearAuth