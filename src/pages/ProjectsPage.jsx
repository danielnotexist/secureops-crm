import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Plus, Trash2, Edit2, X, Calendar, User, ChevronDown } from 'lucide-react'

const STATUS = {
  planning:   { label: '📋 תכנון',    cls: 'badge-inactive',   col: '#8896b3' },
  active:     { label: '🟡 פעיל',     cls: 'badge-inprogress', col: '#f59e0b' },
  done:       { label: '✅ הושלם',    cls: 'badge-done',       col: '#22c55e' },
  paused:     { label: '⏸️ מושהה',    cls: 'badge-inactive',   col: '#8896b3' },
}
const PRIORITY = {
  high:   { label: '🔥 גבוהה', col: '#ef4444' },
  medium: { label: '⚡ בינונית', col: '#f59e0b' },
  low:    { label: '🟢 נמוכה', col: '#22c55e' },
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const addToast = useToast()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name')
    ])
    setProjects(p || [])
    setClients(c || [])
    setLoading(false)
  }

  const deleteProject = async (id, name) => {
    if (!confirm(`למחוק את הפרויקט "${name}"?`)) return
    await supabase.from('projects').delete().eq('id', id)
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'delete_project', description: `מחק פרויקט: ${name}` })
    addToast('פרויקט נמחק', 'success')
    loadAll()
  }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  const groupedByClient = filtered.reduce((acc, p) => {
    const key = p.clients?.name || 'ללא לקוח'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const totalRevenue = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const activeCount = projects.filter(p => p.status === 'active').length

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>📁 פרויקטים</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>{projects.length} פרויקטים · {activeCount} פעילים</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true) }}>
          <Plus size={16} /> פרויקט חדש
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {Object.entries(STATUS).map(([key, s]) => {
          const count = projects.filter(p => p.status === key).length
          return (
            <div key={key} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s', border: filter === key ? '1px solid var(--primary)' : undefined }}
              onClick={() => setFilter(filter === key ? 'all' : key)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: s.col }}>{count}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          )
        })}
        <div className="card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>₪{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>💰 תקציב כולל</div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilter('all')}>🔍 הכל ({projects.length})</button>
        {Object.entries(STATUS).map(([key, s]) => (
          <button key={key} className={`btn ${filter === key ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilter(filter === key ? 'all' : key)}>
            {s.label} ({projects.filter(p => p.status === key).length})
          </button>
        ))}
      </div>

      {/* Projects */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📁</span>
          <h3>אין פרויקטים</h3>
          <p>הוסף פרויקט חדש כדי להתחיל</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> פרויקט חדש</button>
        </div>
      ) : (
        Object.entries(groupedByClient).map(([clientName, projs]) => (
          <div key={clientName} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={13} /> {clientName} <span style={{ background: 'var(--bg3)', padding: '1px 8px', borderRadius: 20, fontSize: 12 }}>{projs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projs.map((p, i) => (
                <div key={p.id} className="card" style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
                  borderRight: `4px solid ${STATUS[p.status]?.col || 'var(--border)'}`,
                  transition: 'all 0.15s', animationDelay: `${i * 0.06}s`, animation: 'fadeIn 0.3s ease both'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                      <span className={`badge ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label}</span>
                      {p.priority && <span style={{ fontSize: 11, color: PRIORITY[p.priority]?.col }}>{PRIORITY[p.priority]?.label}</span>}
                    </div>
                    {p.description && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{p.description}</div>}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text3)' }}>
                      {p.start_date && <span><Calendar size={12} style={{ display: 'inline', marginLeft: 4 }} />{p.start_date} {p.end_date && `← ${p.end_date}`}</span>}
                      {p.assigned_to && <span>👤 {p.assigned_to === 'daniel' ? 'דניאל' : 'דביר'}</span>}
                      {p.budget && <span style={{ color: 'var(--success)', fontWeight: 600 }}>💰 ₪{Number(p.budget).toLocaleString()}</span>}
                    </div>
                    {/* Progress bar */}
                    {p.progress != null && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
                          <span>התקדמות</span><span>{p.progress}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.progress}%`, background: `linear-gradient(90deg, var(--primary), var(--accent))`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => { setEditProject(p); setShowModal(true) }}><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }} onClick={() => deleteProject(p.id, p.name)}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
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
    assigned_to: project?.assigned_to || user.email.startsWith('daniel') ? 'daniel' : 'dvir',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    budget: project?.budget || '',
    progress: project?.progress ?? 0,
    notes: project?.notes || ''
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) { addToast('שם הפרויקט שדה חובה', 'error'); return }
    setLoading(true)
    const payload = { ...form, budget: form.budget ? Number(form.budget) : null, progress: Number(form.progress) }
    if (project?.id) {
      await supabase.from('projects').update(payload).eq('id', project.id)
      await supabase.from('activity_log').insert({ user_email: user.email, action: 'update_project', description: `עדכן פרויקט: ${form.name}` })
      addToast('פרויקט עודכן ✅', 'success')
    } else {
      await supabase.from('projects').insert(payload)
      await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_project', description: `הוסיף פרויקט חדש: ${form.name}` })
      addToast('פרויקט נוסף! 🎉', 'success')
    }
    setLoading(false)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{project ? '✏️ עריכת פרויקט' : '📁 פרויקט חדש'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>שם הפרויקט *</label>
              <input className="input" placeholder="הטמעת EDR" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>לקוח</label>
              <select className="input" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                <option value="">בחר לקוח</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>אחראי</label>
              <select className="input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="daniel">👤 דניאל</option>
                <option value="dvir">👤 דביר</option>
              </select>
            </div>
            <div className="form-group">
              <label>סטטוס</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>עדיפות</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {Object.entries(PRIORITY).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>תאריך התחלה</label>
              <input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>תאריך סיום</label>
              <input className="input" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>תיאור</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>תקציב (₪)</label>
            <input className="input" type="number" placeholder="10000" value={form.budget} onChange={e => set('budget', e.target.value)} />
          </div>
          <div className="form-group">
            <label>התקדמות: {form.progress}%</label>
            <input type="range" min="0" max="100" value={form.progress} onChange={e => set('progress', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} />
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: `${form.progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 3 }} />
            </div>
          </div>
          <div className="form-group">
            <label>הערות</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ שומר...' : project ? '💾 שמור' : '📁 צור פרויקט'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
