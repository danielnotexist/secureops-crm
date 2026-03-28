import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, FolderKanban, Activity, LogOut,
  Menu, X, ChevronRight, Ticket, PanelRightClose, PanelRightOpen, Moon, Sun,
} from 'lucide-react'

const THEME_KEY = 'secureops_theme'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'לוח בקרה' },
  { to: '/clients', icon: Users, label: 'לקוחות' },
  { to: '/projects', icon: FolderKanban, label: 'פרויקטים' },
  { to: '/tickets', icon: Ticket, label: 'קריאות' },
  { to: '/log', icon: Activity, label: 'יומן פעילות' },
]

function NavItem({ to, icon: Icon, label, onClick, collapsed }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `nav-link-app${isActive ? ' active' : ''}`}
      style={{ justifyContent: collapsed ? 'center' : undefined }}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} strokeWidth={2} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

function SidebarContent({ onClose, user, logout, collapsed }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: collapsed ? '14px 8px' : '18px 14px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }} aria-hidden>🛡️</span>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>SecureOps</div>
              <div className="sidebar-brand-sub">מערכת ניהול לקוחות</div>
            </div>
          )}
        </div>
        {onClose && (
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="סגור תפריט">
            <X size={16} />
          </button>
        )}
      </div>

      {!collapsed && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {user?.name?.[0]}
          </div>
          <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} dir="ltr">
              {user?.email}
            </div>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '12px 10px', overflow: 'auto' }}>
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', padding: '0 8px 10px', letterSpacing: '0.08em' }}>תפריט</div>
        )}
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} collapsed={collapsed} />
        ))}
      </nav>

      <div style={{ padding: '10px 10px 12px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--primary-soft)',
              marginBottom: 8,
              fontSize: 11,
              color: 'var(--primary)',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            SecureOps CRM
          </div>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8 }}
          onClick={logout}
        >
          <LogOut size={14} />
          {!collapsed && 'יציאה'}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('secureops_sidebar_collapsed') === '1')
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const toggleSidebar = () => {
    setSidebarCollapsed((c) => {
      const next = !c
      localStorage.setItem('secureops_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  const currentPage = navItems.find((n) => location.pathname === n.to || (n.to !== '/dashboard' && location.pathname.startsWith(n.to + '/')))
  const sidebarWidth = sidebarCollapsed ? 72 : 'var(--sidebar-w)'

  return (
    <div className="app-shell">
      <aside
        className="hide-mobile"
        style={{
          width: sidebarWidth,
          minWidth: sidebarCollapsed ? 72 : undefined,
          background: 'var(--bg2)',
          borderInlineEnd: '1px solid var(--border)',
          flexShrink: 0,
          transition: 'width 0.2s ease, min-width 0.2s ease',
          overflow: 'hidden',
        }}
      >
        <SidebarContent user={user} logout={logout} collapsed={sidebarCollapsed} />
      </aside>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }} onClick={() => setMobileOpen(false)} />
          <aside
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 280,
              background: 'var(--bg2)',
              borderInlineStart: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'slideInMob 0.22s ease',
            }}
          >
            <SidebarContent user={user} logout={logout} onClose={() => setMobileOpen(false)} collapsed={false} />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideInMob { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media(max-width:768px){ .hide-mobile { display: none !important; } }
      `}</style>

      <div className="app-main">
        <header
          style={{
            height: 'var(--header-h)',
            background: 'var(--bg2)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 10,
            flexShrink: 0,
            direction: 'rtl',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button
              type="button"
              className="btn btn-ghost btn-icon hide-mobile"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
            >
              {sidebarCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
            </button>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text2)' }} className="hide-mobile">
              SecureOps CRM
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {location.pathname !== '/dashboard' && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} aria-label="חזור">
              <ChevronRight size={18} />
            </button>
          )}

          {currentPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <currentPage.icon size={17} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{currentPage.label}</span>
            </div>
          )}

          <div style={{ flex: 1 }} />

          <button type="button" id="mob-menu" className="btn btn-ghost btn-icon" style={{ display: 'none' }} onClick={() => setMobileOpen(true)} aria-label="תפריט">
            <Menu size={18} />
          </button>
          <style>{`@media(max-width:768px){#mob-menu{display:flex!important}}`}</style>

          <button type="button" className="btn btn-ghost btn-icon" onClick={toggleTheme} aria-label="ערכת צבעים">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: '20px 18px', background: 'var(--bg)' }}>{children}</main>
      </div>
    </div>
  )
}
