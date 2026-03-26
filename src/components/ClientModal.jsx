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
    industry: client?.industry || 'tech',
    status: client?.status || 'active',
    monthly_value: client?.monthly_value || '',
    notes: client?.notes || ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) { addToast('שם הלקוח הוא שדה חובה', 'error'); return }
    setLoading(true)
    try {
      const payload = { ...form, monthly_value: form.monthly_value ? Number(form.monthly_value) : null }
      if (client?.id) {
        await supabase.from('clients').update(payload).eq('id', client.id)
        await supabase.from('activity_log').insert({ user_email: user.email, action: 'update_client', description: `עדכן לקוח: ${form.name}` })
        addToast('הלקוח עודכן ✅', 'success')
      } else {
        await supabase.from('clients').insert(payload)
        await supabase.from('activity_log').insert({ user_email: user.email, action: 'add_client', description: `הוסיף לקוח חדש: ${form.name}` })
        addToast('הלקוח נוסף! 🎉', 'success')
      }
      onSaved()
    } catch {
      addToast('שגיאה בשמירה', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{client ? '✏️ עריכת לקוח' : '➕ לקוח חדש'}</span>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label>שם החברה *</label>
              <input className="input" placeholder="חברת ABC" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>איש קשר</label>
              <input className="input" placeholder="ישראל ישראלי" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>טלפון</label>
              <input className="input" placeholder="050-1234567" value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label>מייל</label>
              <input className="input" placeholder="info@company.co.il" value={form.email} onChange={e => set('email', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label>עיר</label>
              <input className="input" placeholder="תל אביב" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label>אתר</label>
              <input className="input" placeholder="www.company.co.il" value={form.website} onChange={e => set('website', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label>ענף</label>
              <select className="input" value={form.industry} onChange={e => set('industry', e.target.value)}>
                <option value="tech">טכנולוגיה</option>
                <option value="law">משפטים</option>
                <option value="retail">קמעונאות</option>
                <option value="finance">פיננסים</option>
                <option value="health">בריאות</option>
                <option value="other">אחר</option>
              </select>
            </div>
            <div className="form-group">
              <label>סטטוס</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">פעיל</option>
                <option value="potential">פוטנציאלי</option>
                <option value="inactive">לא פעיל</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>תשלום חודשי (₪)</label>
            <input className="input" type="number" placeholder="2500" value={form.monthly_value} onChange={e => set('monthly_value', e.target.value)} />
          </div>
          <div className="form-group">
            <label>הערות</label>
            <textarea className="input" placeholder="הערות נוספות..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ שומר...' : client ? '💾 שמור שינויים' : '➕ הוסף לקוח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
