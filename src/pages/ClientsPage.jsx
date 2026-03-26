import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Search, Plus, Trash2, Eye, Phone, MapPin, Filter } from 'lucide-react'
import ClientModal from '../components/ClientModal'

const statusMap = {
  active: { label: '✅ פעיל', cls: 'badge-active' },
  potential: { label: '🌱 פוטנציאלי', cls: 'badge-potential' },
  inactive: { label: '⚪ לא פעיל', cls: 'badge-inactive' }
}
const industryMap = {
  tech: { label: 'טכנולוגיה', cls: 'badge-tech' },
  law: { label: 'משפטים', cls: 'badge-law' },
  retail: { label: 'קמעונאות', cls: 'badge-retail' }
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

  useEffect(() => { loadClients() }, [])

  const loadClients = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const deleteClient = async (id, e) => {
    e.stopPropagation()
    if (!confirm('למחוק לקוח זה?')) return
    const client = clients.find(c => c.id === id)
    await supabase.from('clients').delete().eq('id', id)
    await supabase.from('activity_log').insert({ user_email: user.email, action: 'delete_client', description: `מחק לקוח: ${client?.name}` })
    addToast('הלקוח נמחק', 'success')
    loadClients()
  }

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>👥 לקוחות</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>{clients.length} לקוחות במערכת</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> לקוח חדש
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input className="input" style={{ paddingRight: 38 }} placeholder="חיפוש לפי שם, עיר, איש קשר..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'active', 'potential', 'inactive'].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilter(s)}>
            {s === 'all' ? '🔍 הכל' : statusMap[s]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>לא נמצאו לקוחות</h3>
          <p>נסה לשנות את הסינון או הוסף לקוח חדש</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((c, i) => (
            <div
              key={c.id}
              onClick={() => navigate(`/clients/${c.id}`)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.15s', animationDelay: `${i * 0.05}s`,
                animation: 'fadeIn 0.3s ease both'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(45,110,246,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)' }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, hsl(${(c.name?.charCodeAt(0) || 0) * 7 % 360},60%,40%), hsl(${(c.name?.charCodeAt(0) || 0) * 7 % 360 + 40},70%,50%))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#fff'
              }}>{c.name?.[0]}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                  <span className={`badge ${statusMap[c.status]?.cls || 'badge-inactive'}`}>{statusMap[c.status]?.label}</span>
                  {c.industry && <span className={`badge ${industryMap[c.industry]?.cls || 'badge-tech'}`}>{industryMap[c.industry]?.label || c.industry}</span>}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                  {c.contact_name && <span style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>👤 {c.contact_name}</span>}
                  {c.phone && <span style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {c.phone}</span>}
                  {c.city && <span style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {c.city}</span>}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 20, marginLeft: 8 }}>
                {[
                  { label: 'שירותים', value: c.services_count || 0 },
                  { label: 'נכסים', value: c.assets_count || 0 },
                  { label: 'קריאות', value: c.tickets_count || 0 }
                ].map(st => (
                  <div key={st.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{st.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{st.label}</div>
                  </div>
                ))}
              </div>

              {/* Revenue */}
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--success)' }}>
                  {c.monthly_value ? `₪${Number(c.monthly_value).toLocaleString()}` : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>חודש/חדש</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => navigate(`/clients/${c.id}`)}>
                  <Eye size={14} />
                </button>
                <button className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }} onClick={e => deleteClient(c.id, e)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ClientModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); loadClients() }} />}
    </div>
  )
}
