import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Search, Plus, Trash2, Eye, Phone, MapPin } from 'lucide-react'
import ClientModal from '../components/ClientModal'

const statusMap = {
  active: { label: 'פעיל', cls: 'badge-active' },
  potential: { label: 'פוטנציאלי', cls: 'badge-potential' },
  inactive: { label: 'לא פעיל', cls: 'badge-inactive' },
}
const industryMap = {
  tech: { label: 'טכנולוגיה', cls: 'badge-tech' },
  law: { label: 'משפטים', cls: 'badge-law' },
  retail: { label: 'קמעונאות', cls: 'badge-retail' },
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useToast()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const deleteClient = async (id, e) => {
    e.stopPropagation()
    if (!confirm('למחוק לקוח זה?')) return
    const client = clients.find((c) => c.id === id)
    await supabase.from('clients').delete().eq('id', id)
    await supabase.from('activity_log').insert({
      user_email: user.email,
      action: 'delete_client',
      description: `מחק לקוח: ${client?.name}`,
    })
    addToast('הלקוח נמחק', 'success')
    loadClients()
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch =
      !search ||
      c.name?.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="animate-in" dir="rtl">
      <div className="page-header-row" style={{ marginBottom: 22 }}>
        <div className="page-title-block">
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>לקוחות</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>{clients.length} לקוחות במערכת</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> לקוח חדש
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-search-wrap" style={{ flex: 1, minWidth: 220 }}>
          <Search className="search-ico" size={16} />
          <input
            className="input"
            placeholder="חיפוש לפי שם, תחום, עיר, איש קשר..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {['all', 'active', 'potential', 'inactive'].map((s) => (
          <button
            key={s}
            type="button"
            className={`btn ${filter === s ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'הכל' : statusMap[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>לא נמצאו לקוחות</h3>
          <p>נסה לשנות את הסינון או הוסף לקוח חדש</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((c, i) => {
            const openTix = Number(c.tickets_count) || 0
            const contactsN = Number(c.contacts_count) || 0
            const docsN = Number(c.documents_count) || 0
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                }}
                onClick={() => navigate(`/clients/${c.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/clients/${c.id}`)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    flexWrap: 'wrap',
                    padding: '14px 18px',
                    direction: 'rtl',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: `linear-gradient(135deg, hsl(${(c.name?.charCodeAt(0) || 0) * 7 % 360}, 55%, 42%), hsl(${(c.name?.charCodeAt(0) || 0) * 7 % 360 + 40}, 65%, 52%))`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#fff',
                    }}
                  >
                    {c.name?.[0]}
                  </div>

                  <div style={{ flex: 1, minWidth: 160, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</span>
                      <span className={`badge ${statusMap[c.status]?.cls || 'badge-inactive'}`}>{statusMap[c.status]?.label}</span>
                      {c.industry && (
                        <span className={`badge ${industryMap[c.industry]?.cls || 'badge-tech'}`}>
                          {industryMap[c.industry]?.label || c.industry}
                        </span>
                      )}
                      {openTix > 0 && (
                        <span className="badge badge-tickets-open">🎫 {openTix} קריאות פתוחות</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', justifyContent: 'flex-start', fontSize: 13, color: 'var(--text2)' }}>
                      {c.contact_name && <span>👤 {c.contact_name}</span>}
                      {c.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} dir="ltr">
                          <Phone size={12} /> {c.phone}
                        </span>
                      )}
                      {c.city && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {c.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginInlineStart: 'auto', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center', minWidth: 88 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>
                        {c.monthly_value ? `${Number(c.monthly_value).toLocaleString()} ₪` : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>/חודש</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => navigate(`/clients/${c.id}`)}>
                        <Eye size={14} />
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }} onClick={(e) => deleteClient(c.id, e)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '0 18px' }} />
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    padding: '12px 18px',
                    justifyContent: 'flex-start',
                    fontSize: 12,
                    color: 'var(--text2)',
                  }}
                >
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{c.services_count || 0}</strong> שירותים
                  </span>
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{c.assets_count || 0}</strong> נכסים
                  </span>
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{contactsN}</strong> אנשי קשר
                  </span>
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{docsN}</strong> מסמכים
                  </span>
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{openTix}</strong> קריאות
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <ClientModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); loadClients() }} />}
    </div>
  )
}
