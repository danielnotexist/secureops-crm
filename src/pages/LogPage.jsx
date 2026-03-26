import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, Filter } from 'lucide-react'

const ACTION_ICONS = {
  login: '🔐',
  add_client: '➕',
  update_client: '✏️',
  delete_client: '🗑️',
  add_service: '🔧',
  delete_service: '🗑️',
  add_asset: '💾',
  delete_asset: '🗑️',
  add_ticket: '🎫',
  delete_ticket: '🗑️',
  add_contact: '👤',
  delete_contact: '🗑️',
  add_project: '📁',
  update_project: '✏️',
  delete_project: '🗑️',
}

export default function LogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 30

  useEffect(() => { loadLogs() }, [filter, page])

  const loadLogs = async () => {
    setLoading(true)
    let q = supabase.from('activity_log').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (filter !== 'all') q = q.eq('user_email', filter === 'daniel' ? 'daniel@secureops.co.il' : 'dvir@secureops.co.il')
    const { data } = await q
    setLogs(data || [])
    setLoading(false)
  }

  const groupedByDay = logs.reduce((acc, log) => {
    const day = new Date(log.created_at).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[day]) acc[day] = []
    acc[day].push(log)
    return acc
  }, {})

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>📋 יומן פעילות</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>כל השינויים במערכת — מי עשה מה ומתי</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadLogs}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> רענון
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all', label: '👥 כולם' },
          { key: 'daniel', label: '👤 דניאל' },
          { key: 'dvir', label: '👤 דביר' },
        ].map(f => (
          <button key={f.key} className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => { setFilter(f.key); setPage(0) }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>אין פעילות עדיין</h3>
          <p>הפעולות שלך יופיעו כאן</p>
        </div>
      ) : (
        Object.entries(groupedByDay).map(([day, dayLogs]) => (
          <div key={day} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              📅 {day}
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayLogs.map((log, i) => {
                const isDaniel = log.user_email?.startsWith('daniel')
                return (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', borderRadius: 10,
                    background: 'var(--card)', border: '1px solid var(--border)',
                    animation: 'fadeIn 0.3s ease both', animationDelay: `${i * 0.03}s`
                  }}>
                    {/* Icon */}
                    <div style={{ fontSize: 18, flexShrink: 0 }}>{ACTION_ICONS[log.action] || '📝'}</div>

                    {/* User avatar */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: isDaniel ? 'rgba(45,110,246,0.2)' : 'rgba(124,92,252,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                      color: isDaniel ? 'var(--primary)' : 'var(--accent2)'
                    }}>
                      {isDaniel ? 'ד' : 'ד'}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{log.description}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 8 }}>
                        — {isDaniel ? 'דניאל' : 'דביר'}
                      </span>
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0, fontFamily: 'monospace' }}>
                      {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
        {page > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)}>← הקודם</button>}
        {logs.length === PAGE_SIZE && <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)}>הבא →</button>}
      </div>
    </div>
  )
}
