import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Plus, Trash2, Edit2, X, Search } from 'lucide-react'

const STATUS = {
  planning: { label: 'תכנון', cls: 'badge-inactive', col: '#64748b' },
  active: { label: 'פעיל', cls: 'badge-inprogress', col: '#f59e0b' },
  done: { label: 'הושלם', cls: 'badge-done', col: '#10b981' },
  paused: { label: 'מושהה', cls: 'badge-inactive', col: '#64748b' },
}
const PRIORITY = {
  high: { label: '🔥 גבוהה', col: '#ef4444' },
  medium: { label: '⚡ בינונית', col: '#f59e0b' },
  low: { label: '🟢 נמוכה', col: '#10b981' },
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const addToast = useToast()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [openTickets, setOpenTickets] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: p }, { data: c }, { count: tix }] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
    ])
    setProjects(p || [])
    setClients(c || [])
    setOpenTickets(tix ?? 0)
    setLoading(false)
  }

  const deleteProject = async (id, name) => {
    if (!confirm(`למחוק את הפרויקט "${name}"?`)) return
    await supabase.from('projects').delete().eq('id', id)
    await supabase.from('activity_log').insert({
      user_email: user.email,
      action: 'delete_project',
      description: `מחק פרויקט: ${name}`,
    })
    addToast('פרויקט נמחק', 'success')
    loadAll()
  }

  const filtered = (filter === 'all' ? projects : projects.filter((p) => p.status === filter)).filter((p) => {
    const q = search.toLowerCase()
    return !search || p.name?.toLowerCase().includes(q) || p.clients?.name?.toLowerCase().includes(q)
  })

  const summary = [
    { key: 'total', label: 'סה"כ פרויקטים', value: projects.length, col: 'var(--primary)', icon: '📁' },
    { key: 'active', label: 'פעילים', value: projects.filter((p) => p.status === 'active').length, col: '#10b981', icon: '⏱' },
    { key: 'done', label: 'הושלמו', value: projects.filter((p) => p.status === 'done').length, col: 'var(--primary)', icon: '✓' },
    { key: 'tasks', label: 'משימות פתוחות', value: openTickets, col: '#f59e0b', icon: '📋' },
  ]

  return (
    <div className="animate-in" dir="rtl">
      <div className="page-header-row" style={{ marginBottom: 18 }}>
        <div className="page-title-block">
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>פרויקטים</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>ניהול ומעקב אחר פרויקטים ללקוחות</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true) }}>
          <Plus size={15} /> פרויקט חדש
        </button>
      </div>

      <div className="stat-pill-grid" style={{ marginBottom: 18 }}>
        {summary.map((s) => (
          <div key={s.key} className="card" style={{ textAlign: 'center', padding: '14px 12px' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.col }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="input-search-wrap" style={{ marginBottom: 16 }}>
        <Search className="search-ico" size={15} />
        <input className="input" placeholder="חיפוש פרויקט..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilter('all')}>
          הכל ({projects.length})
        </button>
        {Object.entries(STATUS).map(([key, s]) => (
          <button
            key={key}
            type="button"
            className={`btn ${filter === key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setFilter(filter === key ? 'all' : key)}
          >
            {s.label} ({projects.filter((p) => p.status === key).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3 style={{ color: 'var(--text2)', fontWeight: 600 }}>אין פרויקטים עדיין</h3>
          <p>לחץ על &quot;פרויקט חדש&quot; כדי להתחיל</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={13} /> פרויקט חדש
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                flexWrap: 'wrap',
                direction: 'rtl',
                borderInlineStart: `3px solid ${STATUS[p.status]?.col || 'var(--border)'}`,
                transition: 'all 0.15s',
                animationDelay: `${i * 0.05}s`,
                animation: 'fadeIn 0.3s ease both',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                  <span className={`badge ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label}</span>
                  {p.priority && (
                    <span style={{ fontSize: 11, color: PRIORITY[p.priority]?.col, fontWeight: 600 }}>{PRIORITY[p.priority]?.label}</span>
                  )}
                  {p.clients?.name && <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {p.clients.name}</span>}
                </div>
                {p.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{p.description}</div>}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text3)', justifyContent: 'flex-start' }}>
                  {p.start_date && (
                    <span>
                      {p.start_date}
                      {p.end_date && ` → ${p.end_date}`}
                    </span>
                  )}
                  {p.assigned_to && <span>👤 {p.assigned_to === 'daniel' ? 'דניאל' : 'דביר'}</span>}
                  {p.budget && <span style={{ color: 'var(--success)', fontWeight: 600 }}>₪{Number(p.budget).toLocaleString()}</span>}
                </div>
                {p.progress != null && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4, direction: 'rtl' }}>
                      <span>התקדמות</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', direction: 'rtl' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${p.progress}%`,
                          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                          borderRadius: 3,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => { setEditProject(p); setShowModal(true) }}>
                  <Edit2 size={13} />
                </button>
                <button type="button" className="btn btn-danger btn-icon" onClick={() => deleteProject(p.id, p.name)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          clients={clients}
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null) }}
          onSaved={() => { setShowModal(false); setEditProject(null); loadAll() }}
        />
      )}
    </div>
  )
}

function ProjectModal({ clients, project, onClose, onSaved }) {
  const { user } = useAuth()
  const addToast = useToast()
  const [form, setForm] = useState({
    name: project?.name || '',
    client_id: project?.client_id || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    priority: project?.priority || 'medium',
    assigned_to: project?.assigned_to || (user.email.startsWith('daniel') ? 'daniel' : 'dvir'),
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    budget: project?.budget || '',
    progress: project?.progress ?? 0,
    notes: project?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) { addToast('שם הפרויקט שדה חובה', 'error'); return }
    setLoading(true)
    const payload = {
      ...form,
      budget: form.budget ? Number(form.budget) : null,
      progress: Number(form.progress),
      client_id: form.client_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    if (project?.id) {
      await supabase.from('projects').update(payload).eq('id', project.id)
      await supabase.from('activity_log').insert({
        user_email: user.email,
        action: 'update_project',
        description: `עדכן פרויקט: ${form.name}`,
      })
      addToast('פרויקט עודכן ✅', 'success')
    } else {
      const { error } = await supabase.from('projects').insert(payload)
      if (error) { addToast('שגיאה בשמירה: ' + error.message, 'error'); setLoading(false); return }
      await supabase.from('activity_log').insert({
        user_email: user.email,
        action: 'add_project',
        description: `הוסיף פרויקט: ${form.name}`,
      })
      addToast('פרויקט נוסף! 🎉', 'success')
    }
    setLoading(false)
    onSaved()
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{project ? 'עריכת פרויקט' : 'פרויקט חדש'}</span>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>שם הפרויקט *</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>לקוח</label>
              <select className="input" value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
                <option value="">בחר לקוח...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>אחראי</label>
              <select className="input" value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)}>
                <option value="daniel">דניאל</option>
                <option value="dvir">דביר</option>
              </select>
            </div>
            <div className="form-group">
              <label>סטטוס</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS).map(([k, s]) => (
                  <option key={k} value={k}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>עדיפות</label>
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {Object.entries(PRIORITY).map(([k, s]) => (
                  <option key={k} value={k}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>תאריך התחלה</label>
              <input className="input" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>תאריך סיום</label>
              <input className="input" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>תיאור</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>תקציב (₪)</label>
            <input className="input" type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
          </div>
          <div className="form-group">
            <label style={{ direction: 'rtl', textAlign: 'right' }}>התקדמות: {form.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.progress}
              onChange={(e) => set('progress', e.target.value)}
              dir="rtl"
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginBottom: 6 }}
            />
            <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', direction: 'rtl' }}>
              <div
                style={{
                  height: '100%',
                  width: `${form.progress}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
          <div className="form-actions-stack">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'שומר...' : project ? 'שמור שינויים' : 'צור פרויקט'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
