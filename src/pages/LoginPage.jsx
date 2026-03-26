import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import logo from '../assets/logo.png'

export default function LoginPage() {
  const { login, setupPassword, checkIsNewUser } = useAuth()
  const addToast = useToast()
  const [step, setStep] = useState('email') // email | password | setup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    const allowed = ['daniel@secureops.co.il', 'dvir@secureops.co.il']
    if (!allowed.includes(email.toLowerCase())) {
      addToast('כתובת מייל זו אינה מורשת', 'error')
      return
    }
    setLoading(true)
    try {
      const isNew = await checkIsNewUser(email)
      setStep(isNew ? 'setup' : 'password')
    } catch {
      addToast('שגיאה, נסה שוב', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      addToast(err.message || 'שגיאה בהתחברות', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { addToast('הסיסמה חייבת להכיל לפחות 6 תווים', 'error'); return }
    if (password !== confirmPassword) { addToast('הסיסמאות אינן תואמות', 'error'); return }
    setLoading(true)
    try {
      await setupPassword(email, password)
      addToast('הסיסמה נשמרה, ברוך הבא! 🎉', 'success')
    } catch (err) {
      addToast(err.message || 'שגיאה', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,110,246,0.08) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,200,0.05) 0%, transparent 70%)',
        top: '20%',
        right: '20%',
        pointerEvents: 'none'
      }} />

      {/* Logo */}
      <div style={{ marginBottom: 32, animation: 'fadeIn 0.5s ease', textAlign: 'center' }}>
        <img src={logo} alt="SecureOps" style={{ height: 56, objectFit: 'contain' }} />
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'fadeIn 0.5s ease 0.1s both'
      }}>
        {step === 'email' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>כניסה למערכת</h1>
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>הזן את כתובת המייל שלך כדי להמשיך</p>
            </div>
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label>כתובת מייל</label>
                <input
                  className="input"
                  type="email"
                  placeholder="daniel@secureops.co.il"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? '⏳ בודק...' : 'המשך ←'}
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>ברוך הבא!</h1>
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>{email}</p>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>סיסמה</label>
                <input
                  className="input"
                  type="password"
                  placeholder="הסיסמה שלך"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? '⏳ מתחבר...' : '🚀 כניסה'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => setStep('email')}>
                ← חזרה
              </button>
            </form>
          </>
        )}

        {step === 'setup' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>הגדרת סיסמה</h1>
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>זוהי הכניסה הראשונה שלך — צור סיסמה</p>
            </div>
            <form onSubmit={handleSetupSubmit}>
              <div className="form-group">
                <label>סיסמה חדשה</label>
                <input
                  className="input"
                  type="password"
                  placeholder="לפחות 6 תווים"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>אימות סיסמה</label>
                <input
                  className="input"
                  type="password"
                  placeholder="הזן שוב את הסיסמה"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? '⏳ שומר...' : '✅ שמור וכנס'}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        🛡️ SecureOps CRM — גישה מורשית בלבד
      </p>
    </div>
  )
}
