import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { X } from 'lucide-react'

export default function ClientModal({ onClose, onSaved, client }) {
  const { user } = useAuth()
  const addToast = useToast()
  const [form, setForm] = useState({
    name: client?.name || '',
    contact_name: client?.contact_name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    website: client?.website || '',
    city: client?.city || '',
    address: client?.address || '',
    industry: client?.industry || 'tech',
    status: client?.status || 'active',
    monthly_value: client?.monthly_value || '',
    contract_start: client?.contract_start || '',
    contract_end: client?.contract_end || '',
    notes: client?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) { addToast('שם הלקוח הוא שדה חובה', 'error'); return }
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        contact_name: form.contact_name || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        city: form.city || null,
        address: form.address || null,
        industry: form.industry,
        status: form.status,
        monthly_value: form.monthly_value ? Number(form.monthly_value) : null,
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        notes: form.notes || null,
      }
      if (client?.id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
        if (error) throw error
        await supabase.from('activity_log').insert({
          user_email: user.email,
          action: 'update_client',
          description: `עדכן לקוח: ${form.name}`,
        })
        addToast('הלקוח עודכן ✅', 'success')
      } else {
        const { error } = await supabase.from('clients').insert(payload)
        if (error) throw error
        await supabase.from('activity_log').insert({
          user_email: user.email,
          action: 'add_client',
          description: `הוסיף לקוח חדש: ${form.name}`,
        })
        addToast('הלקוח נוסף! 🎉', 'success')
      }
      onSaved()
    } catch (err) {
      addToast(err.message?.includes('column') ? 'הרץ את קובץ המיגרציה ב-Supabase (עמודות חדשות)' : 'שגיאה בשמירה', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{client ? 'עריכת לקוח' : 'הוספת לקוח חדש'}</span>
          <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>שם החברה *</label>
              <input className="input" placeholder="שם החברה" value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>תחום</label>
              <select className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                <option value="tech">טכנולוגיה</option>
                <option value="law">משפטים</option>
                <option value="retail">קמעונאות</option>
                <option value="finance">פיננסים</option>
                <option value="health">בריאות</option>
                <option value="other">אחר</option>
              </select>
            </div>
            <div className="form-group">
              <label>כתובת</label>
              <input className="input" placeholder="רחוב ומספר" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="form-group">
              <label>עיר</label>
              <input className="input" placeholder="תל אביב" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>איש קשר</label>
            <input className="input" placeholder="שם איש קשר" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>טלפון</label>
              <input className="input" placeholder="050-1234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" style={{ textAlign: 'right' }} />
            </div>
            <div className="form-group">
              <label>מייל</label>
              <input className="input" placeholder="info@company.co.il" value={form.email} onChange={(e) => set('email', e.target.value)} dir="ltr" style={{ textAlign: 'right' }} />
            </div>
          </div>

          <div className="form-group">
            <label>אתר אינטרנט</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', direction: 'ltr' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>https://</span>
              <input
                className="input"
                style={{ flex: 1, textAlign: 'right' }}
                placeholder="www.example.co.il"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>סטטוס</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="active">פעיל</option>
                <option value="potential">פוטנציאלי</option>
                <option value="inactive">לא פעיל</option>
              </select>
            </div>
            <div className="form-group">
              <label>תשלום חודשי (₪)</label>
              <input className="input" type="number" placeholder="0" value={form.monthly_value} onChange={(e) => set('monthly_value', e.target.value)} />
            </div>
            <div className="form-group">
              <label>תחילת חוזה</label>
              <input className="input" type="date" value={form.contract_start} onChange={(e) => set('contract_start', e.target.value)} />
            </div>
            <div className="form-group">
              <label>סיום חוזה</label>
              <input className="input" type="date" value={form.contract_end} onChange={(e) => set('contract_end', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>הערות</label>
            <textarea className="input" placeholder="הערות נוספות..." value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>

          <div className="form-actions-stack">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'שומר...' : client ? 'שמור שינויים' : 'הוסף לקוח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
