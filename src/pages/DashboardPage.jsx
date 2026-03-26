import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, FolderKanban, AlertTriangle, CheckCircle, Wrench } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [recentLog, setRecentLog] = useState([])
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '🌅 בוקר טוב' : hour < 17 ? '☀️ צהריים טובים' : '🌙 ערב טוב'

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: clientsData }, { data: projectsData }, { data: logData }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8)
      ])
      const c = clientsData || []
      const p = projectsData || []
      setClients(c)
      setProjects(p)
      setRecentLog(logData || [])
      const totalRevenue = c.reduce((s, x) => s + (x.monthly_value || 0), 0)
      setStats({
        total: c.length,
        active: c.filter(x => x.status === 'active').length,
        revenue: totalRevenue,
        openProjects: p.filter(x => x.status === 'active').length,
        doneProjects: p.filter(x => x.status === 'done').length,
        totalProjects: p.length
      })
    } finally {
      setLoading(false)
    }
  }

  const chartData = [
    { name: 'ינו', value: 3200 }, { name: 'פבר', value: 4100 }, { name: 'מרץ', value: 3800 },
    { name: 'אפר', value: 5200 }, { name: 'מאי', value: 4900 }, { name: 'יונ', value: 6100 },
    { name: 'יול', value: 5800 }, { name: 'אוג', value: stats?.revenue || 7300 }
  ]

  const statCards = stats ? [
    { label: 'סה"כ לקוחות', value: stats.total, icon: '👥', color: '#2d6ef6', sub: `${stats.active} פעילים` },
    { label: 'הכנסה חודשית', value: `₪${stats.revenue.toLocaleString()}`, icon: '💰', color: '#22c55e', sub: 'מכלל הלקוחות' },
    { label: 'פרויקטים פעילים', value: stats.openProjects, icon: '📁', color: '#f59e0b', sub: `${stats.totalProjects} בסך הכל` },
    { label: 'פרויקטים הושלמו', value: stats.doneProjects, icon: '✅', color: '#00e5c8', sub: 'החודש האחרון' },
  ] : []

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />)}
    </div>
  )

  return (
    <div className="animate-in">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
          {greeting}, {user?.name}! 👋
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 15 }}>
          הנה סקירה כללית של המערכת שלך
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} className="card" style={{
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
            animationDelay: `${i * 0.07}s`,
            animation: 'fadeIn 0.4s ease both'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 80, height: 80,
              borderRadius: '0 12px 0 80px',
              background: `${s.color}18`
            }} />
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Revenue chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>📈 מגמת הכנסות</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d6ef6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2d6ef6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }} formatter={v => [`₪${v.toLocaleString()}`, 'הכנסה']} />
              <Area type="monotone" dataKey="value" stroke="#2d6ef6" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent log */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📋 פעילות אחרונה</div>
          {recentLog.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <span className="empty-icon">🕐</span>
              <p>אין פעילות עדיין</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentLog.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: log.user_email?.startsWith('daniel') ? 'rgba(45,110,246,0.2)' : 'rgba(124,92,252,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    color: log.user_email?.startsWith('daniel') ? 'var(--primary)' : 'var(--accent2)'
                  }}>
                    {log.user_email?.startsWith('daniel') ? 'ד' : 'ד'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {log.user_email?.startsWith('daniel') ? 'דניאל' : 'דביר'} · {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent clients */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>👥 לקוחות אחרונים</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>כל הלקוחות →</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.slice(0, 4).map(c => (
            <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(45,110,246,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)' }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#fff'
              }}>
                {c.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.contact_name} · {c.city}</div>
              </div>
              <div>
                <span className={`badge badge-${c.status === 'active' ? 'active' : c.status === 'potential' ? 'potential' : 'inactive'}`}>
                  {c.status === 'active' ? '✅ פעיל' : c.status === 'potential' ? '🌱 פוטנציאלי' : '⚪ לא פעיל'}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', minWidth: 70, textAlign: 'left' }}>
                {c.monthly_value ? `₪${c.monthly_value.toLocaleString()}` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
