import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import {
  LayoutDashboard, Users, FolderKanban, Activity, LogOut,
  Menu, X, ChevronLeft, Ticket, Settings, FileText
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'לוח בקרה',     emoji: '🏠' },
  { to: '/clients',    icon: Users,            label: 'לקוחות',        emoji: '👥' },
  { to: '/projects',  icon: FolderKanban,     label: 'פרויקטים',      emoji: '📁' },
  { to: '/tickets',   icon: Ticket,           label: 'קריאות שירות',  emoji: '🎫' },
  { to: '/log',       icon: Activity,         label: 'יומן פעילות',   emoji: '📋' },
]

function NavItem({ to, icon: Icon, label, emoji, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
        borderRadius: 8, marginBottom: 2, textDecoration: 'none',
        fontSize: 13, fontWeight: isActive ? 700 : 500,
        color: isActive ? '#fff' : 'var(--text2)',
        background: isActive ? 'var(--primary)' : 'transparent',
        transition: 'all 0.15s'
      })}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <span>{label}</span>
    </NavLink>
  )
}

function SidebarContent({ onClose, user, logout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '16px 14px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={logo} alt="SecureOps" style={{ height: 34, objectFit: 'contain' }} />
        {onClose && (
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        )}
      </div>

      {/* User */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff'
        }}>{user?.name?.[0]}</div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', padding: '0 8px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>תפריט</div>
        {navItems.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)}

        <div style={{ height: 1, background: 'var(--border)', margin: '12px 4px' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', padding: '0 8px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>כללי</div>
        <NavLink to="/log" onClick={onClose}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 8, marginBottom: 2, textDecoration: 'none',
            fontSize: 13, fontWeight: isActive ? 700 : 500,
            color: isActive ? '#fff' : 'var(--text2)',
            background: isActive ? 'var(--primary)' : 'transparent',
            transition: 'all 0.15s'
          })}>
          <span style={{ fontSize: 15 }}>📋</span>
          <span>יומן פעילות</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>🛡️</span>
          <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>SecureOps CRM v2</span>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }} onClick={logout}>
          <LogOut size={14} /> יציאה
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside className="hide-mobile" style={{
        width: 'var(--sidebar-w)', background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)', flexShrink: 0
      }}>
        <SidebarContent user={user} logout={logout} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 240,
            background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)', animation: 'slideIn 0.22s ease'
          }}>
            <SidebarContent user={user} logout={logout} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media(max-width:768px) { .hide-mobile { display: none !important; } }
      `}</style>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-h)', background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0
        }}>
          <button id="mob-menu" className="btn btn-ghost btn-icon" style={{ display: 'none' }} onClick={() => setMobileOpen(true)}>
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
              <span style={{ fontSize: 18 }}>{currentPage.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{currentPage.label}</span>
            </div>
          )}

          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--text3)' }} className="hide-mobile">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '20px 16px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
