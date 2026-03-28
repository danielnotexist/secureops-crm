-- ============================================
-- SecureOps CRM - Supabase Schema
-- הרץ את זה ב-Supabase SQL Editor
-- ============================================

-- משתמשי מערכת (דניאל ודביר)
CREATE TABLE IF NOT EXISTS manage_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- לקוחות
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  industry TEXT DEFAULT 'tech',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','potential','inactive')),
  monthly_value NUMERIC,
  notes TEXT,
  services_count INT DEFAULT 0,
  assets_count INT DEFAULT 0,
  tickets_count INT DEFAULT 0,
  contacts_count INT DEFAULT 0,
  documents_count INT DEFAULT 0,
  address TEXT,
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- שירותים
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  provider TEXT,
  price NUMERIC,
  licenses INT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- נכסים
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  ip TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- קריאות שירות
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','inprogress','closed')),
  resolution_notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- אנשי קשר
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- פרויקטים
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning','active','done','paused')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  assigned_to TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- יומן פעילות
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- עדכון מונה שירותים/נכסים/קריאות אוטומטי
-- ============================================
CREATE OR REPLACE FUNCTION update_client_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'services' THEN
    UPDATE clients SET services_count = (SELECT COUNT(*) FROM services WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)) WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  ELSIF TG_TABLE_NAME = 'assets' THEN
    UPDATE clients SET assets_count = (SELECT COUNT(*) FROM assets WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)) WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  ELSIF TG_TABLE_NAME = 'tickets' THEN
    UPDATE clients SET tickets_count = (SELECT COUNT(*) FROM tickets WHERE client_id = COALESCE(NEW.client_id, OLD.client_id) AND status != 'closed') WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_services_count AFTER INSERT OR DELETE ON services FOR EACH ROW EXECUTE FUNCTION update_client_counts();
CREATE OR REPLACE TRIGGER trg_assets_count AFTER INSERT OR DELETE ON assets FOR EACH ROW EXECUTE FUNCTION update_client_counts();
CREATE OR REPLACE TRIGGER trg_tickets_count AFTER INSERT OR DELETE OR UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_client_counts();

-- ============================================
-- RLS - Row Level Security (פתוח לanon לפי הצורך)
-- ============================================
ALTER TABLE manage_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- מדיניות: anon יכול לקרוא ולכתוב (האפליקציה מגנה בצד הלקוח)
CREATE POLICY "allow_all_manage_users" ON manage_users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clients" ON clients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_services" ON services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_assets" ON assets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tickets" ON tickets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contacts" ON contacts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projects" ON projects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_log" ON activity_log FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- דאטה לדוגמה (אופציונלי - הסר אם לא צריך)
-- ============================================
INSERT INTO clients (name, contact_name, phone, email, city, industry, status, monthly_value) VALUES
  ('חברת אלפא טכנולוגיות', 'יוסי כהן', '050-1234567', 'yossi@alpha-tech.co.il', 'תל אביב', 'tech', 'active', 4500),
  ('משרד עורכי דין ברק', 'דנה ברק', '052-9876543', 'dana@barak-law.co.il', 'תל אביב', 'law', 'active', 2800),
  ('רשת מרכולים שפע', 'אבי לוי', '054-5551234', 'avi@shefa.co.il', 'חיפה', 'retail', 'potential', 0)
ON CONFLICT DO NOTHING;
