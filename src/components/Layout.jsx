import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import {
  LayoutDashboard, Users, FolderKanban, Activity, LogOut, Shield, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'לוח בקרה', emoji: '🏠' },
  { to: '/clients', icon: Users, label: 'לקוחות', emoji: '👥' },
  { to: '/projects', icon: FolderKanban, label: 'פרויקטים', emoji: '📁' },
  { to: '/log', icon: Activity, label: 'יומן פעילות', emoji: '📋' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <img src={logo} alt="SecureOps" style={{ height: 36, objectFit: 'contain' }} />
        </div>

        {/* User */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0
          }}>
            {user?.name?.[0] || '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflow: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ניווט</div>
          {navItems.map(({ to, icon: Icon, label, emoji }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--text)' : 'var(--text2)',
                background: isActive ? 'rgba(45,110,246,0.15)' : 'transparent',
                borderRight: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(45,110,246,0.08)',
            marginBottom: 8
          }}>
            <Shield size={14} color="var(--primary)" />
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>SecureOps CRM</span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
            onClick={logout}
          >
            <LogOut size={14} />
            יציאה
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-h)',
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 8,
          flexShrink: 0
        }}>
          <span style={{ fontSize: 20 }}>{currentPage?.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{currentPage?.label}</span>
          <ChevronRight size={16} color="var(--text3)" style={{ transform: 'rotate(180deg)' }} />
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>SecureOps</span>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {new Date().toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long' })}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
