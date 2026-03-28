import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { ChevronRight, Edit2, Trash2, Plus, Phone, Mail, Globe, MapPin, X, CheckCircle } from 'lucide-react'
import ClientModal from '../components/ClientModal'

const TABS = [
  { id: 'services', label: 'שירותים', icon: '🔧' },
  { id: 'assets', label: 'נכסים', icon: '💾' },
  { id: 'tickets', label: 'קריאות', icon: '🎫' },
  { id: 'contacts', label: 'אנשי קשר', icon: '👤' },
  { id: 'documents', label: 'מסמכים', icon: '📄' },
  { id: 'company', label: 'פרטי חברה', icon: '🏢' },
]

const STATUS_MAP = { active: { label: 'פעיל', cls: 'badge-active' }, potential: { label: 'פוטנציאלי', cls: 'badge-potential' }, inactive: { label: 'לא פעיל', cls: 'badge-inactive' } }

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useToast()
  const [client, setClient] = useState(null)
  const [services, setServices] = useState([])
  const [assets, setAssets] = useState([])
  const [tickets, setTickets] = useState([])
  const [contacts, setContacts] = useState([])
  const [documents, setDocuments] = useState([])
  const [tab, setTab] = useState('services')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'edit' | 'service' | 'asset' | 'ticket' | 'contact'
  const [editItem, setEditItem] = useState(null)

  useEffect(() => { loadAll() }, [id])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: c }, { data: s }, { data: a }, { data: t }, { data: ct }, docRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('services').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('assets').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('client_documents').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ])
    setClient(c)
    setServices(s || [])
    setAssets(a || [])
    setTickets(t || [])
    setContacts(ct || [])
    setDocuments(!docRes.error && docRes.data ? docRes.data : [])
    setLoading(false)
  }

  const log = (action, desc) => supabase.from('activity_log').insert({ user_email: user.email, action, description: desc })

  const deleteItem = async (table, itemId, name) => {
    if (!confirm(`למחוק "${name}"?`)) return
    const { error } = await supabase.from(table).delete().eq('id', itemId)
    if (error) { addToast('שגיאה במחיקה: ' + error.message, 'error'); return }
    await log(`delete_${table}`, `מחק ${name} מ-${client.name}`)
    addToast('נמחק ✅', 'success')
    loadAll()
  }

  const resolveTicket = async (ticket) => {
    const resolution = prompt('תאר כיצד הבעיה נפתרה:')
    if (resolution === null) return
    await supabase.from('tickets').update({ status: 'closed', resolution_notes: resolution, updated_at: new Date().toISOString() }).eq('id', ticket.id)
    await log('resolve_ticket', `סגר קריאה "${ticket.subject}" ב-${client.name}`)
    addToast('קריאה נסגרה ✅', 'success'); loadAll()
  }

  const closeModal = () => { setModal(null); setEditItem(null) }
  const afterSave = () => { closeModal(); loadAll() }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
    </div>
  )
  if (!client) return <div className="empty-state"><h3>לקוח לא נמצא</h3></div>

  const openTickets = tickets.filter(t => t.status !== 'closed').length

  return (
    <div className="animate-in" dir="rtl">
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/clients')}>
        <ChevronRight size={16} /> חזרה ללקוחות
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, hsl(${(client.name?.charCodeAt(0)||0)*7%360},55%,38%), hsl(${(client.name?.charCodeAt(0)||0)*7%360+40},65%,48%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
            {client.name?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800 }}>{client.name}</h1>
              <span className={`badge ${STATUS_MAP[client.status]?.cls}`}>{STATUS_MAP[client.status]?.label}</span>
              {client.industry && <span className="badge badge-tech">{client.industry}</span>}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {client.contact_name && <span style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>👤 {client.contact_name}</span>}
              {client.phone && <a href={`tel:${client.phone}`} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Phone size={11} /> {client.phone}</a>}
              {client.email && <a href={`mailto:${client.email}`} style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Mail size={11} /> {client.email}</a>}
              {client.city && <span style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {client.city}</span>}
              {client.website && <a href={`https://${client.website}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Globe size={11} /> {client.website}</a>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'קריאות פתוחות', value: openTickets, color: openTickets > 0 ? 'var(--danger)' : 'var(--text3)', icon: '🎫' },
              { label: 'אנשי קשר', value: contacts.length, color: 'var(--text2)', icon: '👤' },
              { label: 'נכסים', value: assets.length, color: 'var(--text2)', icon: '💾' },
              { label: 'שירותים', value: services.length, color: 'var(--text2)', icon: '🔧' },
              { label: 'חודשי', value: client.monthly_value ? `₪${Number(client.monthly_value).toLocaleString()}` : '—', color: 'var(--success)', icon: '💰' },
            ].map(st => (
              <div key={st.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12 }}>{st.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: st.color, lineHeight: 1.2 }}>{st.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{st.label}</div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setModal('edit')}><Edit2 size={13} /> עריכה</button>
          </div>
        </div>
      </div>

      {/* Tabs — סדר מימין לשמאל */}
      <div className="tabs-row">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: tab === tb.id ? 700 : 500,
              color: tab === tb.id ? 'var(--primary)' : 'var(--text2)',
              borderBottom: `2px solid ${tab === tb.id ? 'var(--primary)' : 'transparent'}`,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tb.icon} {tb.label}
            {tb.id === 'tickets' && openTickets > 0 && (
              <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{openTickets}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in">

        {/* SERVICES */}
        {tab === 'services' && (
          <Section title={`🔧 שירותים (${services.length})`} onAdd={() => setModal('service')}>
            {services.length === 0 ? <Empty text="אין שירותים עדיין" /> : services.map(s => (
              <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, direction: 'rtl' }}>
                  <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                      <span className={`badge badge-${s.status === 'active' ? 'active' : 'inactive'}`}>{s.status === 'active' ? '✅ פעיל' : '⚪ לא פעיל'}</span>
                      {s.type && <span className="badge badge-tech">{s.type}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                      {s.provider && <span>🏭 {s.provider}</span>}
                      {s.price && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>💰 ₪{Number(s.price).toLocaleString()}/חודש</span>}
                      {s.licenses && <span>📋 {s.licenses} רישיונות</span>}
                      {s.start_date && <span>📅 {s.start_date}{s.end_date ? ` ← ${s.end_date}` : ''}</span>}
                    </div>
                    {s.notes && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>📝 {s.notes}</div>}
                  </div>
                  <button className="btn btn-danger btn-icon" onClick={() => deleteItem('services', s.id, s.name)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* ASSETS */}
        {tab === 'assets' && (
          <Section title={`💾 נכסים (${assets.length})`} onAdd={() => setModal('asset')}>
            {assets.length === 0 ? <Empty text="אין נכסים עדיין" /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
                {assets.map(a => (
                  <div key={a.id} className="card" style={{ position: 'relative' }}>
                    <button type="button" className="btn btn-danger btn-icon" style={{ position: 'absolute', top: 10, insetInlineEnd: 10 }} onClick={() => deleteItem('assets', a.id, a.name)}><Trash2 size={12} /></button>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{a.type === 'server' ? '🖥️' : a.type === 'firewall' ? '🛡️' : a.type === 'switch' ? '🔀' : a.type === 'nas' ? '💽' : '💻'}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{a.name}</div>
                    {a.type && <div style={{ fontSize: 12, color: 'var(--text3)' }}>סוג: {a.type}</div>}
                    {a.ip && <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace' }}>📡 {a.ip}</div>}
                    {a.location && <div style={{ fontSize: 12, color: 'var(--text2)' }}>📍 {a.location}</div>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* TICKETS */}
        {tab === 'tickets' && (
          <Section title={`🎫 קריאות שירות (${tickets.length})`} onAdd={() => { setEditItem(null); setModal('ticket') }}>
            {tickets.length === 0 ? <Empty text="אין קריאות שירות" /> : tickets.map(t => (
              <div
                key={t.id}
                className="card"
                style={{
                  marginBottom: 10,
                  borderInlineStart: `3px solid ${t.status === 'open' ? 'var(--danger)' : t.status === 'inprogress' ? 'var(--warning)' : 'var(--success)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, direction: 'rtl' }}>
                  <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>{t.subject}</span>
                      <span className={`badge badge-${t.status === 'open' ? 'open' : t.status === 'inprogress' ? 'inprogress' : 'done'}`}>
                        {t.status === 'open' ? '🔴 פתוח' : t.status === 'inprogress' ? '🟡 בטיפול' : '🟢 סגור'}
                      </span>
                      {t.priority && <span style={{ fontSize: 11, fontWeight: 600, color: t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--warning)' : 'var(--success)' }}>{t.priority === 'high' ? '🔥 דחוף' : t.priority === 'medium' ? '⚡ בינוני' : '🟢 נמוך'}</span>}
                    </div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{t.description}</div>}
                    {t.resolution_notes && <div style={{ fontSize: 12, background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '5px 10px', marginBottom: 4, color: 'var(--success)' }}>✅ <strong>פתרון:</strong> {t.resolution_notes}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>📅 {new Date(t.created_at).toLocaleDateString('he-IL')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {t.status !== 'closed' && <button className="btn btn-success btn-icon" onClick={() => resolveTicket(t)}><CheckCircle size={14} /></button>}
                    <button className="btn btn-ghost btn-icon" onClick={() => { setEditItem(t); setModal('ticket') }}><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-icon" onClick={() => deleteItem('tickets', t.id, t.subject)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* CONTACTS */}
        {tab === 'contacts' && (
          <Section title={`👤 אנשי קשר (${contacts.length})`} onAdd={() => setModal('contact')}>
            {contacts.length === 0 ? <Empty text="אין אנשי קשר" /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
                {contacts.map(c => (
                  <div key={c.id} className="card" style={{ position: 'relative' }}>
                    <button type="button" className="btn btn-danger btn-icon" style={{ position: 'absolute', top: 10, insetInlineEnd: 10 }} onClick={() => deleteItem('contacts', c.id, c.name)}><Trash2 size={12} /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff' }}>{c.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        {c.role && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.role}</div>}
                      </div>
                    </div>
                    {c.phone && <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', textDecoration: 'none', marginBottom: 4 }}><Phone size={11} /> {c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}><Mail size={11} /> {c.email}</a>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* DOCUMENTS */}
        {tab === 'documents' && (
          <Section title={`📄 מסמכים (${documents.length})`} onAdd={null}>
            {documents.length === 0 ? (
              <Empty text="אין מסמכים — ניתן להוסיף לאחר הרצת המיגרציה ב-Supabase" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {documents.map((d) => (
                  <div key={d.id} className="card" style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700 }}>{d.name}</div>
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)' }}>
                        קישור לקובץ
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* COMPANY */}
        {tab === 'company' && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>🏢 פרטי חברה</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal('edit')}><Edit2 size={13} /> עריכה</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
              {[
                ['🏢', 'שם החברה', client.name],
                ['👤', 'איש קשר', client.contact_name],
                ['📞', 'טלפון', client.phone],
                ['📧', 'מייל', client.email],
                ['🏠', 'כתובת', client.address],
                ['📍', 'עיר', client.city],
                ['🌐', 'אתר', client.website],
                ['🏭', 'ענף', client.industry],
                ['💰', 'תשלום חודשי', client.monthly_value ? `₪${Number(client.monthly_value).toLocaleString()}` : '—'],
                ['📅', 'תחילת חוזה', client.contract_start],
                ['📅', 'סיום חוזה', client.contract_end],
              ].map(([icon, label, value]) => (
                <div key={label} style={{ padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{icon} {label}</div>
                  <div style={{ fontWeight: 600, color: value ? 'var(--text)' : 'var(--text3)', fontSize: 13 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
            {client.notes && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>📝 הערות</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{client.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'edit' && <ClientModal client={client} onClose={closeModal} onSaved={afterSave} />}
      {modal === 'service' && <ServiceModal clientId={id} clientName={client.name} onClose={closeModal} onSaved={afterSave} />}
      {modal === 'asset' && <AssetModal clientId={id} clientName={client.name} onClose={closeModal} onSaved={afterSave} />}
      {modal === 'ticket' && <TicketModal clientId={id} clientName={client.name} ticket={editItem} onClose={closeModal} onSaved={afterSave} />}
      {modal === 'contact' && <ContactModal clientId={id} clientName={client.name} onClose={closeModal} onSaved={afterSave} />}
    </div>
  )
}

/* ---- Reusable helpers ---- */
function Section({ title, onAdd, children }) {
  return (
    <div dir="rtl">
      <div className="page-header-row" style={{ marginBottom: 14 }}>
        <div className="page-title-block" style={{ fontWeight: 700, fontSize: 15 }}>
          {title}
        </div>
        {onAdd && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}>
            <Plus size={13} /> הוסף
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
function Empty({ text }) {
  return <div className="empty-state"><div style={{ fontSize: 36, opacity: 0.4 }}>📭</div><p>{text}</p></div>
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 560 } : {}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
function Footer({ onClose, loading, label }) {
  return (
    <div className="form-actions" style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '⏳ שומר...' : label}</button>
    </div>
  )
}

/* ---- Service Modal ---- */
function ServiceModal({ clientId, clientName, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [f, setF] = useState({ name: '', type: '', provider: '', price: '', licenses: '', start_date: '', end_date: '', status: 'active', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) { addToast('שם השירות שדה חובה', 'error'); return }
    setLoading(true)
    const payload = {
      name: f.name.trim(), type: f.type || null, provider: f.provider || null,
      price: f.price ? Number(f.price) : null,
      licenses: f.licenses ? Number(f.licenses) : null,
      start_date: f.start_date || null, end_date: f.end_date || null,
      status: f.status, notes: f.notes || null, client_id: clientId
    }
    const { error } = await supabase.from('services').insert(payload)
    if (error) { addToast('שגיאה: ' + error.message, 'error'); setLoading(false); return }
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_service', description: `הוסיף שירות "${f.name}" ל-${clientName}` })
    addToast('שירות נוסף ✅', 'success'); setLoading(false); onSaved()
  }

  return (
    <Modal title="🔧 הוספת שירות" onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="form-grid-2">
          <div className="form-group">
            <label>שם השירות *</label>
            <input className="input" autoFocus placeholder="גיבוי שרתים" value={f.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>סוג שירות</label>
            <select className="input" value={f.type} onChange={e => set('type', e.target.value)}>
              <option value="">בחר סוג</option>
              <option value="גיבוי">גיבוי</option>
              <option value="EDR">EDR</option>
              <option value="אבטחת מיילים">אבטחת מיילים</option>
              <option value="פיירוול">פיירוול</option>
              <option value="אנטיוירוס">אנטיוירוס</option>
              <option value="ניטור">ניטור</option>
              <option value="אחר">אחר</option>
            </select>
          </div>
          <div className="form-group">
            <label>ספק</label>
            <input className="input" placeholder="Acronis, CrowdStrike..." value={f.provider} onChange={e => set('provider', e.target.value)} />
          </div>
          <div className="form-group">
            <label>מחיר חודשי (₪)</label>
            <input className="input" type="number" min="0" placeholder="1500" value={f.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className="form-group">
            <label>כמות רישיונות</label>
            <input className="input" type="number" min="0" placeholder="10" value={f.licenses} onChange={e => set('licenses', e.target.value)} />
          </div>
          <div className="form-group">
            <label>סטטוס</label>
            <select className="input" value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="active">✅ פעיל</option>
              <option value="inactive">⚪ לא פעיל</option>
            </select>
          </div>
          <div className="form-group">
            <label>תאריך התחלה</label>
            <input className="input" type="date" value={f.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label>תאריך סיום</label>
            <input className="input" type="date" value={f.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>הערות</label>
          <textarea className="input" rows={2} placeholder="הערות נוספות..." value={f.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <Footer onClose={onClose} loading={loading} label="➕ הוסף שירות" />
      </form>
    </Modal>
  )
}

/* ---- Asset Modal ---- */
function AssetModal({ clientId, clientName, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [f, setF] = useState({ name: '', type: '', ip: '', location: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) { addToast('שם הנכס שדה חובה', 'error'); return }
    setLoading(true)
    const { error } = await supabase.from('assets').insert({ name: f.name.trim(), type: f.type || null, ip: f.ip || null, location: f.location || null, notes: f.notes || null, client_id: clientId })
    if (error) { addToast('שגיאה: ' + error.message, 'error'); setLoading(false); return }
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_asset', description: `הוסיף נכס "${f.name}" ל-${clientName}` })
    addToast('נכס נוסף ✅', 'success'); setLoading(false); onSaved()
  }

  return (
    <Modal title="💾 הוספת נכס" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid-2">
          <div className="form-group">
            <label>שם הנכס *</label>
            <input className="input" autoFocus placeholder="שרת ראשי" value={f.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>סוג</label>
            <select className="input" value={f.type} onChange={e => set('type', e.target.value)}>
              <option value="">בחר סוג</option>
              <option value="server">🖥️ שרת</option>
              <option value="firewall">🛡️ פיירוול</option>
              <option value="switch">🔀 סוויץ'</option>
              <option value="workstation">💻 תחנת עבודה</option>
              <option value="nas">💽 NAS</option>
              <option value="other">📦 אחר</option>
            </select>
          </div>
          <div className="form-group">
            <label>כתובת IP</label>
            <input className="input" dir="ltr" placeholder="192.168.1.1" value={f.ip} onChange={e => set('ip', e.target.value)} />
          </div>
          <div className="form-group">
            <label>מיקום</label>
            <input className="input" placeholder="חדר שרתים" value={f.location} onChange={e => set('location', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>הערות</label>
          <textarea className="input" rows={2} value={f.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <Footer onClose={onClose} loading={loading} label="➕ הוסף נכס" />
      </form>
    </Modal>
  )
}

/* ---- Ticket Modal ---- */
function TicketModal({ clientId, clientName, ticket, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [f, setF] = useState({
    subject: ticket?.subject || '',
    description: ticket?.description || '',
    priority: ticket?.priority || 'medium',
    status: ticket?.status || 'open',
    resolution_notes: ticket?.resolution_notes || '',
    assigned_to: ticket?.assigned_to || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!f.subject.trim()) { addToast('נושא שדה חובה', 'error'); return }
    setLoading(true)
    const payload = {
      subject: f.subject.trim(),
      description: f.description || null,
      priority: f.priority,
      status: f.status,
      resolution_notes: f.resolution_notes || null,
      assigned_to: f.assigned_to?.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (ticket?.id) {
      const { error } = await supabase.from('tickets').update(payload).eq('id', ticket.id)
      if (error) { addToast('שגיאה: ' + error.message, 'error'); setLoading(false); return }
      await supabase.from('activity_log').insert({ user_email: user.email, action: 'update_ticket', description: `עדכן קריאה "${f.subject}" ב-${clientName}` })
      addToast('קריאה עודכנה ✅', 'success')
    } else {
      const { error } = await supabase.from('tickets').insert({ ...payload, client_id: clientId })
      if (error) { addToast('שגיאה: ' + error.message, 'error'); setLoading(false); return }
      await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_ticket', description: `פתח קריאה "${f.subject}" ב-${clientName}` })
      addToast('קריאה נפתחה ✅', 'success')
    }
    setLoading(false); onSaved()
  }

  return (
    <Modal title={ticket ? '✏️ עריכת קריאה' : '🎫 פתיחת קריאה'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>נושא הקריאה *</label>
          <input className="input" autoFocus placeholder="תיאור קצר של הבעיה" value={f.subject} onChange={e => set('subject', e.target.value)} />
        </div>
        <div className="form-group">
          <label>תיאור מפורט</label>
          <textarea className="input" rows={3} placeholder="פרט את הבעיה..." value={f.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <label>סטטוס</label>
            <select className="input" value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="open">🔴 פתוח</option>
              <option value="inprogress">🟡 בטיפול</option>
              <option value="closed">🟢 סגור</option>
            </select>
          </div>
          <div className="form-group">
            <label>עדיפות</label>
            <select className="input" value={f.priority} onChange={e => set('priority', e.target.value)}>
              <option value="high">🔥 דחוף</option>
              <option value="medium">⚡ בינוני</option>
              <option value="low">🟢 נמוך</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>מטפל</label>
          <input className="input" placeholder="שם המטפל" value={f.assigned_to} onChange={e => set('assigned_to', e.target.value)} />
        </div>
        {f.status === 'closed' && (
          <div className="form-group">
            <label>הערות פתרון</label>
            <textarea className="input" rows={2} placeholder="כיצד הבעיה נפתרה?" value={f.resolution_notes} onChange={e => set('resolution_notes', e.target.value)} />
          </div>
        )}
        <Footer onClose={onClose} loading={loading} label={ticket ? '💾 שמור שינויים' : '🎫 פתח קריאה'} />
      </form>
    </Modal>
  )
}

/* ---- Contact Modal ---- */
function ContactModal({ clientId, clientName, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [f, setF] = useState({ name: '', role: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) { addToast('שם שדה חובה', 'error'); return }
    setLoading(true)
    const { error } = await supabase.from('contacts').insert({ name: f.name.trim(), role: f.role || null, phone: f.phone || null, email: f.email || null, client_id: clientId })
    if (error) { addToast('שגיאה: ' + error.message, 'error'); setLoading(false); return }
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_contact', description: `הוסיף איש קשר "${f.name}" ל-${clientName}` })
    addToast('איש קשר נוסף ✅', 'success'); setLoading(false); onSaved()
  }

  return (
    <Modal title="👤 הוספת איש קשר" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid-2">
          <div className="form-group">
            <label>שם *</label>
            <input className="input" autoFocus placeholder="ישראל ישראלי" value={f.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>תפקיד</label>
            <input className="input" placeholder="מנהל IT" value={f.role} onChange={e => set('role', e.target.value)} />
          </div>
          <div className="form-group">
            <label>טלפון</label>
            <input className="input" dir="ltr" placeholder="050-1234567" value={f.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>מייל</label>
            <input className="input" dir="ltr" placeholder="name@company.co.il" value={f.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <Footer onClose={onClose} loading={loading} label="➕ הוסף" />
      </form>
    </Modal>
  )
}
