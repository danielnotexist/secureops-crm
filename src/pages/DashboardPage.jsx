import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Users, FolderKanban, Ticket, Wrench, Server, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [openTickets, setOpenTickets] = useState(0)
  const [activeServices, setActiveServices] = useState(0)
  const [assetsTotal, setAssetsTotal] = useState(0)
  const [expiringSoon, setExpiringSoon] = useState(0)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const today = new Date()
      const in30 = new Date(today)
      in30.setDate(in30.getDate() + 30)
      const in30s = in30.toISOString().slice(0, 10)

      const [
        { data: clientsData },
        { data: projectsData },
        { count: openTix },
        { count: svcActive },
        { count: assetsC },
        { data: expiring },
      ] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase
          .from('services')
          .select('id')
          .eq('status', 'active')
          .not('end_date', 'is', null)
          .lte('end_date', in30s)
          .gte('end_date', today.toISOString().slice(0, 10)),
      ])

      const c = clientsData || []
      const p = projectsData || []
      setClients(c)
      setProjects(p)
      setOpenTickets(openTix ?? 0)
      setActiveServices(svcActive ?? 0)
      setAssetsTotal(assetsC ?? 0)
      setExpiringSoon(Array.isArray(expiring) ? expiring.length : 0)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = clients.reduce((s, x) => s + (Number(x.monthly_value) || 0), 0)
  const activeClients = clients.filter((x) => x.status === 'active').length
  const activeProjects = projects.filter((x) => x.status === 'active').length

  const statCards = [
    { label: 'סה"כ לקוחות', value: clients.length, sub: `${activeClients} פעילים`, icon: Users, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    { label: 'לקוחות פעילים', value: activeClients, sub: 'מתוך כלל הרשומות', icon: Users, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
    { label: 'הכנסה חודשית', value: `₪${totalRevenue.toLocaleString()}`, sub: 'מסכום תשלומים חודשיים', icon: null, emoji: '💵', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
    { label: 'נכסים מנוהלים', value: assetsTotal, sub: 'בכל הלקוחות', icon: Server, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { label: 'שירותים פעילים', value: activeServices, sub: 'מנויים פעילים', icon: Wrench, color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
    { label: 'פרויקטים פעילים', value: activeProjects, sub: `${projects.length} בסך הכל`, icon: FolderKanban, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
    { label: 'קריאות פתוחות', value: openTickets, sub: 'דורשות טיפול', icon: Ticket, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
    { label: 'שירותים שפגים בקרוב', value: expiringSoon, sub: 'ב-30 הימים הקרובים', icon: AlertTriangle, color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton" style={{ height: 108, borderRadius: 12 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="animate-in" dir="rtl">
      <div className="page-title-block" style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>לוח בקרה</h1>
        <p style={{ color: 'var(--text2)', marginTop: 6, fontSize: 14 }}>סקירה כללית של מערכת ניהול הלקוחות</p>
      </div>

      <div className="stat-pill-grid" style={{ marginBottom: 22 }}>
        {statCards.map((s, i) => {
          const Ico = s.icon
          return (
            <div
              key={s.label}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 16px',
                animation: `fadeIn 0.35s ease ${i * 0.04}s both`,
              }}
            >
              <div style={{ textAlign: 'right', minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1.15 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{s.sub}</div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: s.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {Ico ? <Ico size={22} color={s.color} strokeWidth={2} /> : <span style={{ fontSize: 22 }}>{s.emoji}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="page-header-row" style={{ marginBottom: 14 }}>
          <div className="page-title-block">
            <div style={{ fontWeight: 700, fontSize: 15 }}>לקוחות אחרונים</div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>
            כל הלקוחות ←
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.slice(0, 4).map((c) => {
            const openT = c.tickets_count ?? 0
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/clients/${c.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/clients/${c.id}`)}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  boxShadow: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--primary-soft), rgba(124,58,237,0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--primary)',
                    }}
                  >
                    {c.name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 140, textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {c.contact_name || '—'} {c.city ? `· ${c.city}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {openT > 0 && (
                      <span className="badge badge-tickets-open">
                        🎫 {openT} קריאות
                      </span>
                    )}
                    <span className={`badge badge-${c.status === 'active' ? 'active' : c.status === 'potential' ? 'potential' : 'inactive'}`}>
                      {c.status === 'active' ? 'פעיל' : c.status === 'potential' ? 'פוטנציאלי' : 'לא פעיל'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'left', marginInlineStart: 'auto' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>
                      {c.monthly_value ? `${Number(c.monthly_value).toLocaleString()} ₪` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'left' }}>
                      {c.monthly_value ? `${Number(c.services_count || 0)} שירותים · ${Number(c.assets_count || 0)} נכסים` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
