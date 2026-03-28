import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Plus, Trash2, Edit2, CheckCircle, X, RefreshCw, Search } from 'lucide-react'

const STATUS_MAP = {
  open: { label: 'פתוח', cls: 'badge-open', color: 'var(--danger)' },
  inprogress: { label: 'בטיפול', cls: 'badge-inprogress', color: 'var(--warning)' },
  closed: { label: 'סגור', cls: 'badge-done', color: 'var(--success)' },
}
const PRIORITY_MAP = {
  high: { label: '🔥 דחוף', color: 'var(--danger)' },
  medium: { label: '⚡ בינוני', color: 'var(--warning)' },
  low: { label: '🟢 נמוך', color: 'var(--success)' },
}

export default function TicketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const addToast = useToast()
  const [tickets, setTickets] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTicket, setEditTicket] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tickets').select('*, clients(id, name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name'),
    ])
    setTickets(t || [])
    setClients(c || [])
    setLoading(false)
  }

  const deleteTicket = async (id, subject) => {
    if (!confirm(`למחוק קריאה "${subject}"?`)) return
    await supabase.from('tickets').delete().eq('id', id)
    await supabase.from('activity_log').insert({
      user_email: user.email,
      action: 'delete_ticket',
      description: `מחק קריאה: ${subject}`,
    })
    addToast('קריאה נמחקה', 'success')
    loadAll()
  }

  const resolveTicket = async (ticket) => {
    const resolution = prompt('תאר כיצד הבעיה נפתרה:')
    if (resolution === null) return
    await supabase
      .from('tickets')
      .update({ status: 'closed', resolution_notes: resolution, updated_at: new Date().toISOString() })
      .eq('id', ticket.id)
    await supabase.from('activity_log').insert({
      user_email: user.email,
      action: 'resolve_ticket',
      description: `סגר קריאה "${ticket.subject}"`,
    })
    addToast('קריאה נסגרה ✅', 'success')
    loadAll()
  }

  const filtered = tickets.filter((tk) => {
    const matchFilter = filter === 'all' || tk.status === filter
    const q = search.toLowerCase()
    const handler = (tk.assigned_to || '').toLowerCase()
    const matchSearch =
      !search ||
      tk.subject?.toLowerCase().includes(q) ||
      tk.clients?.name?.toLowerCase().includes(q) ||
      handler.includes(q)
    return matchFilter && matchSearch
  })

  const counts = {
    all: tickets.length,
    open: tickets.filter((tk) => tk.status === 'open').length,
    inprogress: tickets.filter((tk) => tk.status === 'inprogress').length,
    closed: tickets.filter((tk) => tk.status === 'closed').length,
  }

  const statOrder = [
    { key: 'all', label: 'סה"כ קריאות', icon: '🎫', color: 'var(--primary)' },
    { key: 'open', label: 'פתוחות', icon: '🔴', color: 'var(--danger)' },
    { key: 'inprogress', label: 'בטיפול', icon: '🟡', color: 'var(--warning)' },
    { key: 'closed', label: 'נסגרו', icon: '🟢', color: 'var(--success)' },
  ]

  return (
    <div className="animate-in" dir="rtl">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div className="page-title-block">
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>קריאות שירות</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            ניהול כל הקריאות מכל הלקוחות · {counts.open} פתוחות · {counts.inprogress} בטיפול · {counts.closed} סגורות
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={loadAll}>
            <RefreshCw size={13} />
          </button>
          <button type="button" className="btn btn-primary" onClick={() => { setEditTicket(null); setShowModal(true) }}>
            <Plus size={15} /> קריאה חדשה
          </button>
        </div>
      </div>

      <div className="stat-pill-grid" style={{ marginBottom: 18 }}>
        {statOrder.map((s) => (
          <button
            key={s.key}
            type="button"
            className="card"
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              border: filter === s.key ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.15s',
              background: 'var(--card)',
            }}
            onClick={() => setFilter(s.key)}
          >
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{counts[s.key]}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <Search className="search-ico" size={15} />
          <input
            className="input"
            placeholder="חיפוש לפי נושא, לקוח, מטפל..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 160 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">כל הסטטוסים</option>
          <option value="open">פתוחות</option>
          <option value="inprogress">בטיפול</option>
          <option value="closed">סגורות</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 40 }}>🎫</div>
          <h3 style={{ color: 'var(--text2)', fontWeight: 600 }}>אין קריאות</h3>
          <p>לא נמצאו קריאות בסינון הנוכחי</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((tk, i) => (
            <div
              key={tk.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                direction: 'rtl',
                borderInlineStart: `3px solid ${STATUS_MAP[tk.status]?.color || 'var(--border)'}`,
                animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{tk.subject}</span>
                  <span className={`badge ${STATUS_MAP[tk.status]?.cls}`}>{STATUS_MAP[tk.status]?.label}</span>
                  {tk.priority && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_MAP[tk.priority]?.color }}>
                      {PRIORITY_MAP[tk.priority]?.label}
                    </span>
                  )}
                </div>
                {tk.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>{tk.description}</div>}
                {tk.resolution_notes && (
                  <div
                    style={{
                      fontSize: 12,
                      background: 'var(--success-bg)',
                      border: '1px solid rgba(5,150,105,0.2)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      marginBottom: 5,
                      color: 'var(--success)',
                    }}
                  >
                    <strong>פתרון:</strong> {tk.resolution_notes}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                  {tk.clients?.name && (
                    <span
                      role="link"
                      tabIndex={0}
                      style={{ cursor: 'pointer', color: 'var(--primary)' }}
                      onClick={() => navigate(`/clients/${tk.clients.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/clients/${tk.clients.id}`)}
                    >
                      👥 {tk.clients.name}
                    </span>
                  )}
                  {tk.assigned_to && <span>מטפל: {tk.assigned_to}</span>}
                  <span>נפתח: {new Date(tk.created_at).toLocaleDateString('he-IL')}</span>
                  {tk.updated_at && tk.updated_at !== tk.created_at && (
                    <span>עודכן: {new Date(tk.updated_at).toLocaleDateString('he-IL')}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {tk.status !== 'closed' && (
                  <button type="button" className="btn btn-success btn-icon" title="סגור קריאה" onClick={() => resolveTicket(tk)}>
                    <CheckCircle size={14} />
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => { setEditTicket(tk); setShowModal(true) }}>
                  <Edit2 size={13} />
                </button>
                <button type="button" className="btn btn-danger btn-icon" onClick={() => deleteTicket(tk.id, tk.subject)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TicketModal
          clients={clients}
          ticket={editTicket}
          onClose={() => { setShowModal(false); setEditTicket(null) }}
          onSaved={() => { setShowModal(false); setEditTicket(null); loadAll() }}
        />
      )}
    </div>
  )
}

function TicketModal({ clients, ticket, onClose, onSaved }) {
  const { user } = useAuth()
  const addToast = useToast()
  const [form, setForm] = useState({
    subject: ticket?.subject || '',
    description: ticket?.description || '',
    client_id: ticket?.client_id || '',
    priority: ticket?.priority || 'medium',
    status: ticket?.status || 'open',
    resolution_notes: ticket?.resolution_notes || '',
    assigned_to: ticket?.assigned_to || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject) { addToast('נושא שדה חובה', 'error'); return }
    setLoading(true)
    const payload = {
      ...form,
      client_id: form.client_id || null,
      assigned_to: form.assigned_to?.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (ticket?.id) {
      await supabase.from('tickets').update(payload).eq('id', ticket.id)
      await supabase.from('activity_log').insert({
        user_email: user.email,
        action: 'update_ticket',
        description: `עדכן קריאה: ${form.subject}`,
      })
      addToast('קריאה עודכנה ✅', 'success')
    } else {
      const { error } = await supabase.from('tickets').insert(payload)
      if (error) { addToast('שגיאה בשמירה: ' + error.message, 'error'); setLoading(false); return }
      await supabase.from('activity_log').insert({
        user_email: user.email,
        action: 'add_ticket',
        description: `פתח קריאה: ${form.subject}`,
      })
      addToast('קריאה נפתחה ✅', 'success')
    }
    setLoading(false)
    onSaved()
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{ticket ? 'עריכת קריאה' : 'קריאה חדשה'}</span>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
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
            <label>נושא *</label>
            <input className="input" placeholder="תיאור קצר של הבעיה" value={form.subject} onChange={(e) => set('subject', e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>תיאור</label>
            <textarea className="input" rows={3} placeholder="פרט את הבעיה..." value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>סטטוס</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="open">פתוח</option>
                <option value="inprogress">בטיפול</option>
                <option value="closed">סגור</option>
              </select>
            </div>
            <div className="form-group">
              <label>עדיפות</label>
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="high">דחוף</option>
                <option value="medium">בינוני</option>
                <option value="low">נמוך</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>מטפל</label>
            <input className="input" placeholder="שם המטפל" value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)} />
          </div>
          {form.status === 'closed' && (
            <div className="form-group">
              <label>הערות פתרון</label>
              <textarea className="input" rows={2} placeholder="כיצד הבעיה נפתרה?" value={form.resolution_notes} onChange={(e) => set('resolution_notes', e.target.value)} />
            </div>
          )}
          <div className="form-actions-stack">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'שומר...' : ticket ? 'שמור שינויים' : 'פתח קריאה'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
