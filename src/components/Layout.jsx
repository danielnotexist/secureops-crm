import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import { LayoutDashboard, Users, FolderKanban, Activity, LogOut, Menu, X, ChevronLeft } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'לוח בקרה' },
  { to: '/clients', icon: Users, label: 'לקוחות' },
  { to: '/projects', icon: FolderKanban, label: 'פרויקטים' },
  { to: '/log', icon: Activity, label: 'יומן פעילות' },
]

function SidebarContent({ onClose, user, logout }) {
  return (
    <>
      <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={logo} alt="SecureOps" style={{ height: 32, objectFit: 'contain' }} />
        {onClose && <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>}
      </div>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{user?.name?.[0]}</div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>תפריט</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
              borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              fontSize: 13, fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--text)' : 'var(--text2)',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              borderRight: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 0.15s'
            })}>
            <Icon size={16} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }} onClick={logout}>
          <LogOut size={14} /> יציאה
        </button>
      </div>
    </>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)', background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', flexShrink: 0,
        '@media(max-width:768px)': { display: 'none' }
      }} className="hide-mobile">
        <SidebarContent user={user} logout={logout} />
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileOpen(false)} />
          <aside style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 240,
            background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.25s ease',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <SidebarContent user={user} logout={logout} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media(max-width:768px) { .hide-mobile { display: none !important; } }
      `}</style>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-h)', background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0
        }}>
          <button className="btn btn-ghost btn-icon" style={{ display: 'none' }} id="mob-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
          <style>{`@media(max-width:768px){#mob-menu{display:flex!important}}`}</style>

          {location.pathname !== '/dashboard' && (
            <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} />
            </button>
          )}

          {currentPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <currentPage.icon size={16} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>{currentPage.label}</span>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--text3)' }} className="hide-mobile">
            {new Date().toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long' })}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '20px 16px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
