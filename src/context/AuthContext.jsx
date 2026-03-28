import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const ALLOWED_EMAILS = ['daniel@secureops.co.il', 'dvir@secureops.co.il']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('secureops_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      throw new Error('אין גישה לכתובת מייל זו')
    }

    // Dev mode: allow local login when DB is unavailable
    const devKey = `secureops_dev_pass_${email.toLowerCase()}`
    const devPass = localStorage.getItem(devKey)

    let data = null
    let dbAvailable = true
    try {
      const { data: d, error } = await supabase
        .from('manage_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()
      if (error && error.code !== 'PGRST116') dbAvailable = false
      else data = d
    } catch {
      dbAvailable = false
    }

    if (!dbAvailable || !data) {
      // Fallback to locally stored dev password
      if (!devPass) throw new Error('SETUP_REQUIRED')
      if (devPass !== password) throw new Error('סיסמה שגויה')
      const name = email.startsWith('daniel') ? 'דניאל' : 'דביר'
      const userData = { email: email.toLowerCase(), name, id: 'local' }
      setUser(userData)
      localStorage.setItem('secureops_user', JSON.stringify(userData))
      return userData
    }

    const valid = data.password_hash === password
    if (!valid) throw new Error('סיסמה שגויה')

    const userData = { email: data.email, name: data.name, id: data.id }
    setUser(userData)
    localStorage.setItem('secureops_user', JSON.stringify(userData))

    await supabase.from('activity_log').insert({
      user_email: email,
      action: 'login',
      description: 'התחברות למערכת',
    }).catch(() => {})

    return userData
  }

  const setupPassword = async (email, password) => {
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      throw new Error('אין גישה לכתובת מייל זו')
    }
    const name = email.startsWith('daniel') ? 'דניאל' : 'דביר'

    // Always save locally for dev fallback
    const devKey = `secureops_dev_pass_${email.toLowerCase()}`
    localStorage.setItem(devKey, password)

    let userData = { email: email.toLowerCase(), name, id: 'local' }
    try {
      const { data, error } = await supabase
        .from('manage_users')
        .upsert({ email: email.toLowerCase(), password_hash: password, name }, { onConflict: 'email' })
        .select()
        .single()
      if (!error && data) {
        userData = { email: data.email, name: data.name, id: data.id }
      }
    } catch {
      // DB unavailable, use local fallback
    }

    setUser(userData)
    localStorage.setItem('secureops_user', JSON.stringify(userData))
    return userData
  }

  const checkIsNewUser = async (email) => {
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) return false
    const { data } = await supabase
      .from('manage_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()
    return !data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('secureops_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, setupPassword, checkIsNewUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

