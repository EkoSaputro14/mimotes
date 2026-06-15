-- ============================================================
-- 005: Billing Foundation (Stripe-ready)
-- ============================================================

-- 1. invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  subtotal INT NOT NULL DEFAULT 0,
  tax INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoices_workspace_id_idx ON invoices(workspace_id);

-- 2. invoice_line_items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL DEFAULT 0,
  amount INT NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoice_line_items_invoice_id_idx ON invoice_line_items(invoice_id);

-- 3. payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_workspace_id_idx ON payments(workspace_id);
CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON payments(invoice_id);

-- 4. subscription_events
CREATE TABLE IF NOT EXISTS subscription_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  from_plan VARCHAR(50),
  to_plan VARCHAR(50),
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  reason TEXT,
  stripe_event_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_events_workspace_id_idx ON subscription_events(workspace_id);
CREATE INDEX IF NOT EXISTS subscription_events_type_created_idx ON subscription_events(event_type, created_at);

-- 5. Enable RLS on all 4 tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (workspace-scoped)

-- invoices
CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT
  WITH CHECK (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

-- invoice_line_items (inherits via invoice workspace)
CREATE POLICY "invoice_line_items_select"
  ON invoice_line_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE workspace_id::text = current_setting('app.current_workspace_id', true)
    )
  );

CREATE POLICY "invoice_line_items_insert"
  ON invoice_line_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE workspace_id::text = current_setting('app.current_workspace_id', true)
    )
  );

-- payments
CREATE POLICY "payments_select"
  ON payments FOR SELECT
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "payments_insert"
  ON payments FOR INSERT
  WITH CHECK (workspace_id::text = current_setting('app.current_workspace_id', true));

-- subscription_events
CREATE POLICY "subscription_events_select"
  ON subscription_events FOR SELECT
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "subscription_events_insert"
  ON subscription_events FOR INSERT
  WITH CHECK (workspace_id::text = current_setting('app.current_workspace_id', true));

-- 7. Force RLS on all tables
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE subscription_events FORCE ROW LEVEL SECURITY;

-- 8. Record initial subscription events for existing workspaces
INSERT INTO subscription_events (id, workspace_id, event_type, to_plan, to_status, created_at)
SELECT gen_random_uuid()::text, ws.workspace_id, 'subscription_created', 'free', 'active', ws.created_at
FROM workspace_subscriptions ws
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_events se
  WHERE se.workspace_id = ws.workspace_id AND se.event_type = 'subscription_created'
)
ON CONFLICT DO NOTHING;
