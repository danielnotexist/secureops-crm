import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import {
  ArrowRight, Edit2, Trash2, Plus, Phone, Mail, Globe,
  MapPin, X, CheckCircle, Building2, Wrench, HardDrive,
  Ticket, Users, FileText
} from 'lucide-react'
import ClientModal from '../components/ClientModal'

const TABS = [
  { id: 'services',  label: 'שירותים',     icon: '🔧' },
  { id: 'assets',    label: 'נכסים',        icon: '💾' },
  { id: 'tickets',   label: 'קריאות',       icon: '🎫' },
  { id: 'contacts',  label: 'אנשי קשר',    icon: '👤' },
  { id: 'company',   label: 'פרטי חברה',   icon: '🏢' },
]

const statusMap = {
  active:    { label: 'פעיל',        cls: 'badge-active' },
  potential: { label: 'פוטנציאלי',  cls: 'badge-potential' },
  inactive:  { label: 'לא פעיל',    cls: 'badge-inactive' }
}

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
  const [tab, setTab] = useState('services')
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [editTicket, setEditTicket] = useState(null)

  useEffect(() => { loadAll() }, [id])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: c }, { data: s }, { data: a }, { data: t }, { data: ct }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('services').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('assets').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ])
    setClient(c); setServices(s || []); setAssets(a || [])
    setTickets(t || []); setContacts(ct || [])
    setLoading(false)
  }

  const log = (action, desc) => supabase.from('activity_log').insert({ user_email: user.email, action, description: desc })

  const deleteItem = async (table, itemId, name) => {
    if (!confirm(`למחוק "${name}"?`)) return
    await supabase.from(table).delete().eq('id', itemId)
    await log(`delete_${table}`, `מחק ${name} מ-${client.name}`)
    addToast('נמחק', 'success')
    loadAll()
  }

  const resolveTicket = async (ticket) => {
    const resolution = prompt('תאר כיצד הבעיה נפתרה:')
    if (resolution === null) return
    await supabase.from('tickets').update({ status: 'closed', resolution_notes: resolution, updated_at: new Date().toISOString() }).eq('id', ticket.id)
    await log('resolve_ticket', `סגר קריאה "${ticket.subject}" ב-${client.name}`)
    addToast('קריאה נסגרה ✅', 'success')
    loadAll()
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
    </div>
  )
  if (!client) return <div className="empty-state"><h3>לקוח לא נמצא</h3></div>

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'inprogress').length

  return (
    <div className="animate-in" dir="rtl">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/clients')}>
        <ArrowRight size={14} /> חזרה ללקוחות
      </button>

      {/* Client header */}
      <div className="card" style={{ marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
          {/* Avatar */}
          <div style={{
            width: 54, height: 54, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, hsl(${(client.name?.charCodeAt(0)||0)*7%360},55%,38%), hsl(${(client.name?.charCodeAt(0)||0)*7%360+40},65%,48%))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff'
          }}>{client.name?.[0]}</div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800 }}>{client.name}</h1>
              <span className={`badge ${statusMap[client.status]?.cls}`}>{statusMap[client.status]?.label}</span>
              {client.industry && <span className="badge badge-tech">{client.industry}</span>}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {client.contact_name && <span style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>👤 {client.contact_name}</span>}
              {client.phone && <a href={`tel:${client.phone}`} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Phone size={11} /> {client.phone}</a>}
              {client.email && <a href={`mailto:${client.email}`} style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Mail size={11} /> {client.email}</a>}
              {client.city && <span style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {client.city}</span>}
              {client.website && <a href={`https://${client.website}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Globe size={11} /> {client.website}</a>}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'קריאות פתוחות', value: openTickets, color: openTickets > 0 ? 'var(--danger)' : 'var(--text3)', icon: '🎫' },
              { label: 'אנשי קשר', value: contacts.length, color: 'var(--text2)', icon: '👤' },
              { label: 'נכסים', value: assets.length, color: 'var(--text2)', icon: '💾' },
              { label: 'שירותים', value: services.length, color: 'var(--text2)', icon: '🔧' },
              { label: 'חודשי', value: client.monthly_value ? `₪${Number(client.monthly_value).toLocaleString()}` : '—', color: 'var(--success)', icon: '💰' },
            ].map(st => (
              <div key={st.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, marginBottom: 2 }}>{st.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{st.label}</div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}><Edit2 size={13} /> עריכה</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            padding: '8px 14px', fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? 'var(--text)' : 'var(--text2)',
            borderBottom: `2px solid ${tab === t.id ? 'var(--primary)' : 'transparent'}`,
            whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: '-1px',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>{t.icon}</span> {t.label}
            {t.id === 'tickets' && openTickets > 0 && (
              <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{openTickets}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in">

        {/* SERVICES */}
        {tab === 'services' && (
          <Section title="🔧 שירותים" onAdd={() => setShowServiceModal(true)}>
            {services.length === 0 ? <Empty text="אין שירותים עדיין" /> : services.map(s => (
              <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                      <span className={`badge badge-${s.status === 'active' ? 'active' : 'inactive'}`}>{s.status === 'active' ? '✅ פעיל' : '⚪ לא פעיל'}</span>
                      {s.type && <span className="badge badge-tech">{s.type}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                      {s.provider && <span>🏭 ספק: <strong>{s.provider}</strong></span>}
                      {s.price && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>💰 ₪{Number(s.price).toLocaleString()}/חודש</span>}
                      {s.licenses && <span>📋 {s.licenses} רישיונות</span>}
                      {s.start_date && <span>📅 {s.start_date} ← {s.end_date || '∞'}</span>}
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
          <Section title="💾 נכסים" onAdd={() => setShowAssetModal(true)}>
            {assets.length === 0 ? <Empty text="אין נכסים עדיין" /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
                {assets.map(a => (
                  <div key={a.id} className="card" style={{ position: 'relative' }}>
                    <button className="btn btn-danger btn-icon" style={{ position: 'absolute', top: 10, left: 10 }} onClick={() => deleteItem('assets', a.id, a.name)}><Trash2 size={12} /></button>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{a.type === 'server' ? '🖥️' : a.type === 'firewall' ? '🛡️' : a.type === 'switch' ? '🔀' : a.type === 'nas' ? '💽' : '💻'}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{a.name}</div>
                    {a.type && <div style={{ fontSize: 12, color: 'var(--text3)' }}>סוג: {a.type}</div>}
                    {a.ip && <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace' }}>📡 {a.ip}</div>}
                    {a.location && <div style={{ fontSize: 12, color: 'var(--text2)' }}>📍 {a.location}</div>}
                    {a.notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{a.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* TICKETS */}
        {tab === 'tickets' && (
          <Section title="🎫 קריאות שירות" onAdd={() => { setEditTicket(null); setShowTicketModal(true) }}>
            {tickets.length === 0 ? <Empty text="אין קריאות שירות" /> : tickets.map(t => (
              <div key={t.id} className="card" style={{
                marginBottom: 10,
                borderRight: `3px solid ${t.status === 'open' ? 'var(--danger)' : t.status === 'inprogress' ? 'var(--warning)' : 'var(--success)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{t.subject}</span>
                      <span className={`badge badge-${t.status === 'open' ? 'open' : t.status === 'inprogress' ? 'inprogress' : 'done'}`}>
                        {t.status === 'open' ? '🔴 פתוח' : t.status === 'inprogress' ? '🟡 בטיפול' : '🟢 סגור'}
                      </span>
                      {t.priority && <span style={{ fontSize: 11, fontWeight: 600, color: t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--warning)' : 'var(--success)' }}>
                        {t.priority === 'high' ? '🔥 דחוף' : t.priority === 'medium' ? '⚡ בינוני' : '🟢 נמוך'}
                      </span>}
                    </div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>{t.description}</div>}
                    {t.resolution_notes && (
                      <div style={{ fontSize: 12, background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '5px 10px', marginBottom: 5, color: 'var(--success)' }}>
                        ✅ <strong>פתרון:</strong> {t.resolution_notes}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      📅 {new Date(t.created_at).toLocaleDateString('he-IL')}
                      {t.updated_at && t.updated_at !== t.created_at && ` · עודכן: ${new Date(t.updated_at).toLocaleDateString('he-IL')}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {t.status !== 'closed' && (
                      <button className="btn btn-success btn-icon" title="סגור קריאה" onClick={() => resolveTicket(t)}><CheckCircle size={14} /></button>
                    )}
                    <button className="btn btn-ghost btn-icon" onClick={() => { setEditTicket(t); setShowTicketModal(true) }}><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-icon" onClick={() => deleteItem('tickets', t.id, t.subject)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* CONTACTS */}
        {tab === 'contacts' && (
          <Section title="👤 אנשי קשר" onAdd={() => setShowContactModal(true)}>
            {contacts.length === 0 ? <Empty text="אין אנשי קשר" /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
                {contacts.map(c => (
                  <div key={c.id} className="card" style={{ position: 'relative' }}>
                    <button className="btn btn-danger btn-icon" style={{ position: 'absolute', top: 10, left: 10 }} onClick={() => deleteItem('contacts', c.id, c.name)}><Trash2 size={12} /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff' }}>{c.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        {c.role && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.role}</div>}
                      </div>
                    </div>
                    {c.phone && <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', textDecoration: 'none', marginBottom: 5 }}><Phone size={11} /> {c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}><Mail size={11} /> {c.email}</a>}
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
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}><Edit2 size={13} /> עריכה</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 10 }}>
              {[
                { icon: '🏢', label: 'שם החברה', value: client.name },
                { icon: '👤', label: 'איש קשר', value: client.contact_name },
                { icon: '📞', label: 'טלפון', value: client.phone },
                { icon: '📧', label: 'מייל', value: client.email },
                { icon: '📍', label: 'עיר', value: client.city },
                { icon: '🌐', label: 'אתר', value: client.website },
                { icon: '🏭', label: 'ענף', value: client.industry },
                { icon: '💰', label: 'תשלום חודשי', value: client.monthly_value ? `₪${Number(client.monthly_value).toLocaleString()}` : '—' },
              ].map(f => (
                <div key={f.label} style={{ padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{f.icon}</span> {f.label}
                  </div>
                  <div style={{ fontWeight: 600, color: f.value ? 'var(--text)' : 'var(--text3)', fontSize: 13 }}>{f.value || '—'}</div>
                </div>
              ))}
            </div>
            {client.notes && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>📝 הערות</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{client.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEdit && <ClientModal client={client} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); loadAll() }} />}
      {showServiceModal && <ServiceModal clientId={id} clientName={client.name} onClose={() => setShowServiceModal(false)} onSaved={() => { setShowServiceModal(false); loadAll() }} />}
      {showAssetModal && <AssetModal clientId={id} clientName={client.name} onClose={() => setShowAssetModal(false)} onSaved={() => { setShowAssetModal(false); loadAll() }} />}
      {showTicketModal && <TicketModal clientId={id} clientName={client.name} ticket={editTicket} onClose={() => { setShowTicketModal(false); setEditTicket(null) }} onSaved={() => { setShowTicketModal(false); setEditTicket(null); loadAll() }} />}
      {showContactModal && <ContactModal clientId={id} clientName={client.name} onClose={() => setShowContactModal(false)} onSaved={() => { setShowContactModal(false); loadAll() }} />}
    </div>
  )
}

// Reusable helpers
function Section({ title, onAdd, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
        {onAdd && <button className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={13} /> הוסף</button>}
      </div>
      {children}
    </div>
  )
}
function Empty({ text }) {
  return <div className="empty-state"><div style={{ fontSize: 36, opacity: 0.4 }}>📭</div><p>{text}</p></div>
}
function Wrap({ title, onClose, children, wide }) {
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
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
      <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'שומר...' : label}</button>
    </div>
  )
}

function ServiceModal({ clientId, clientName, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [form, setForm] = useState({ name: '', type: '', provider: '', price: '', licenses: '', start_date: '', end_date: '', status: 'active', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e) => {
    e.preventDefault(); if (!form.name) { addToast('שם שדה חובה', 'error'); return }
    setLoading(true)
    await supabase.from('services').insert({ ...form, client_id: clientId, price: form.price ? Number(form.price) : null })
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_service', description: `הוסיף שירות "${form.name}" ל-${clientName}` })
    addToast('שירות נוסף ✅', 'success'); setLoading(false); onSaved()
  }
  return (
    <Wrap title="🔧 הוספת שירות" onClose={onClose} wide>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <div className="form-group"><label>שם *</label><input className="input" autoFocus value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-group"><label>סוג</label><select className="input" value={form.type} onChange={e => set('type', e.target.value)}><option value="">בחר</option><option>גיבוי</option><option>EDR</option><option>אבטחת מיילים</option><option>פיירוול</option><option>אנטיוירוס</option><option>אחר</option></select></div>
          <div className="form-group"><label>ספק</label><input className="input" value={form.provider} onChange={e => set('provider', e.target.value)} /></div>
          <div className="form-group"><label>מחיר חודשי (₪)</label><input className="input" type="number" value={form.price} onChange={e => set('price', e.target.value)} /></div>
          <div className="form-group"><label>רישיונות</label><input className="input" type="number" value={form.licenses} onChange={e => set('licenses', e.target.value)} /></div>
          <div className="form-group"><label>סטטוס</label><select className="input" value={form.status} onChange={e => set('status', e.target.value)}><option value="active">פעיל</option><option value="inactive">לא פעיל</option></select></div>
          <div className="form-group"><label>התחלה</label><input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
          <div className="form-group"><label>סיום</label><input className="input" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
        </div>
        <div className="form-group"><label>הערות</label><textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <Footer onClose={onClose} loading={loading} label="הוסף שירות" />
      </form>
    </Wrap>
  )
}

function AssetModal({ clientId, clientName, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [form, setForm] = useState({ name: '', type: '', ip: '', location: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e) => {
    e.preventDefault(); if (!form.name) { addToast('שם שדה חובה', 'error'); return }
    setLoading(true)
    await supabase.from('assets').insert({ ...form, client_id: clientId })
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_asset', description: `הוסיף נכס "${form.name}" ל-${clientName}` })
    addToast('נכס נוסף ✅', 'success'); setLoading(false); onSaved()
  }
  return (
    <Wrap title="💾 הוספת נכס" onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <div className="form-group"><label>שם *</label><input className="input" autoFocus value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-group"><label>סוג</label><select className="input" value={form.type} onChange={e => set('type', e.target.value)}><option value="">בחר</option><option value="server">שרת</option><option value="firewall">פיירוול</option><option value="switch">סוויץ'</option><option value="workstation">תחנת עבודה</option><option value="nas">NAS</option><option value="other">אחר</option></select></div>
          <div className="form-group"><label>IP</label><input className="input" dir="ltr" value={form.ip} onChange={e => set('ip', e.target.value)} /></div>
          <div className="form-group"><label>מיקום</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} /></div>
        </div>
        <div className="form-group"><label>הערות</label><textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <Footer onClose={onClose} loading={loading} label="הוסף נכס" />
      </form>
    </Wrap>
  )
}

function TicketModal({ clientId, clientName, ticket, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [form, setForm] = useState({ subject: ticket?.subject || '', description: ticket?.description || '', priority: ticket?.priority || 'medium', status: ticket?.status || 'open', resolution_notes: ticket?.resolution_notes || '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e) => {
    e.preventDefault(); if (!form.subject) { addToast('נושא שדה חובה', 'error'); return }
    setLoading(true)
    if (ticket?.id) {
      await supabase.from('tickets').update({ ...form, updated_at: new Date().toISOString() }).eq('id', ticket.id)
      await supabase.from('activity_log').insert({ user_email: user.email, action: 'update_ticket', description: `עדכן קריאה "${form.subject}" ב-${clientName}` })
      addToast('קריאה עודכנה ✅', 'success')
    } else {
      await supabase.from('tickets').insert({ ...form, client_id: clientId })
      await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_ticket', description: `פתח קריאה "${form.subject}" ב-${clientName}` })
      addToast('קריאה נפתחה ✅', 'success')
    }
    setLoading(false); onSaved()
  }
  return (
    <Wrap title={ticket ? '✏️ עריכת קריאה' : '🎫 פתיחת קריאה'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group"><label>נושא *</label><input className="input" autoFocus value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
        <div className="form-group"><label>תיאור</label><textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <div className="form-group"><label>עדיפות</label><select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}><option value="high">🔥 דחוף</option><option value="medium">⚡ בינוני</option><option value="low">🟢 נמוך</option></select></div>
          <div className="form-group"><label>סטטוס</label><select className="input" value={form.status} onChange={e => set('status', e.target.value)}><option value="open">🔴 פתוח</option><option value="inprogress">🟡 בטיפול</option><option value="closed">🟢 סגור</option></select></div>
        </div>
        {form.status === 'closed' && (
          <div className="form-group"><label>הערות פתרון</label><textarea className="input" rows={2} placeholder="כיצד הבעיה נפתרה?" value={form.resolution_notes} onChange={e => set('resolution_notes', e.target.value)} /></div>
        )}
        <Footer onClose={onClose} loading={loading} label={ticket ? 'שמור שינויים' : 'פתח קריאה'} />
      </form>
    </Wrap>
  )
}

function ContactModal({ clientId, clientName, onClose, onSaved }) {
  const { user } = useAuth(); const addToast = useToast()
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async (e) => {
    e.preventDefault(); if (!form.name) { addToast('שם שדה חובה', 'error'); return }
    setLoading(true)
    await supabase.from('contacts').insert({ ...form, client_id: clientId })
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_contact', description: `הוסיף איש קשר "${form.name}" ל-${clientName}` })
    addToast('איש קשר נוסף ✅', 'success'); setLoading(false); onSaved()
  }
  return (
    <Wrap title="👤 הוספת איש קשר" onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <div className="form-group"><label>שם *</label><input className="input" autoFocus value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-group"><label>תפקיד</label><input className="input" value={form.role} onChange={e => set('role', e.target.value)} /></div>
          <div className="form-group"><label>טלפון</label><input className="input" dir="ltr" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="form-group"><label>מייל</label><input className="input" dir="ltr" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        </div>
        <Footer onClose={onClose} loading={loading} label="הוסף" />
      </form>
    </Wrap>
  )
}
