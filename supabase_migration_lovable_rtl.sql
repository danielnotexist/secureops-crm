-- הרץ ב-Supabase SQL Editor (פעם אחת) — תואם Lovable: שדות חסרים + מונה אנשי קשר
-- ============================================

-- קריאות: הערות פתרון + מטפל
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- לקוחות: כתובת, חוזה, מונה אנשי קשר, מונה מסמכים (לתצוגה)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_start DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_end DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contacts_count INT DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS documents_count INT DEFAULT 0;

-- מסמכים (אופציונלי — לטאב מסמכים)
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_client_documents" ON client_documents;
CREATE POLICY "allow_all_client_documents" ON client_documents FOR ALL TO anon USING (true) WITH CHECK (true);

-- עדכון מונה אנשי קשר
CREATE OR REPLACE FUNCTION update_client_contacts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients SET contacts_count = (
    SELECT COUNT(*)::int FROM contacts WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
  ) WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contacts_count ON contacts;
CREATE TRIGGER trg_contacts_count
  AFTER INSERT OR DELETE OR UPDATE OF client_id ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_client_contacts_count();

-- עדכון מונה מסמכים
CREATE OR REPLACE FUNCTION update_client_documents_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients SET documents_count = (
    SELECT COUNT(*)::int FROM client_documents WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
  ) WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_count ON client_documents;
CREATE TRIGGER trg_documents_count
  AFTER INSERT OR DELETE ON client_documents
  FOR EACH ROW EXECUTE FUNCTION update_client_documents_count();

-- סנכרון מונים קיימים
UPDATE clients c SET contacts_count = (SELECT COUNT(*)::int FROM contacts WHERE client_id = c.id);
UPDATE clients c SET documents_count = (SELECT COUNT(*)::int FROM client_documents WHERE client_id = c.id);
