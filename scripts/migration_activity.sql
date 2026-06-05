-- Activity Log table — tracks every create/update/delete for full audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL,
  user_name   TEXT        NOT NULL,
  user_role   TEXT        NOT NULL,
  action      TEXT        NOT NULL CHECK (action IN ('create', 'update', 'delete', 'adjustment')),
  entity_type TEXT        NOT NULL CHECK (entity_type IN ('sale', 'purchase', 'product', 'expense', 'category')),
  entity_id   TEXT        NOT NULL,
  entity_label TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Company members can read their own company's logs
CREATE POLICY "activity_logs_select" ON activity_logs
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Company members can insert logs for their own company
CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_time  ON activity_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_user  ON activity_logs (company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity        ON activity_logs (entity_type, entity_id);
