-- Merged WhatsApp ERP schema for the existing Sales Agent Scraper Supabase project.
-- This migration is intentionally additive/idempotent and does not reset or modify Sales Agent tables/data.


-- SOURCE: supabase/migrations/20260922092751_create_whatsapp_erp_gateway_schema.sql
/*
# WhatsApp ERP Notification Gateway - Core Schema

## Overview
Creates the complete database schema for the WhatsApp ERP Notification Gateway SaaS application.
This includes organizations, users, WhatsApp connections, ERP integrations, API keys,
message templates, message queue, logs, webhook delivery, connection logs,
audit logs, report delivery tokens, and settings.

## Multi-tenant Architecture
Every table is scoped by `organization_id`. Row Level Security ensures each
organization can only access its own records. Users belong to organizations
via the `org_members` table, and RLS policies check membership.

## New Tables
1. organizations - Top-level tenant entity
2. org_members - Links auth.users to organizations with roles
3. whatsapp_connections - WhatsApp number connections (Baileys or Cloud API)
4. erp_integrations - External ERP integrations
5. api_keys - API keys for ERP authentication (stored hashed)
6. message_templates - Reusable message templates with variables
7. message_queue - Outbox queue for messages to send
8. message_logs - Delivery log for each message attempt
9. webhook_logs - Outbound webhook delivery to ERPs
10. connection_logs - WhatsApp connection lifecycle logs
11. audit_logs - Security audit trail
12. report_delivery_tokens - Secure expiring tokens for report access
13. settings - Organization-level settings (key-value)

## Security
- RLS enabled on ALL tables
- All policies check org_members membership for organization scoping
- API keys stored as hashes only
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORG MEMBERS (created first because organizations policies reference it)
-- ============================================================
CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL DEFAULT replace(lower(gen_random_uuid()::text), '-', ''),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FK from org_members to organizations
DO $$ BEGIN
  ALTER TABLE org_members ADD CONSTRAINT org_members_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_own" ON org_members;
CREATE POLICY "members_select_own" ON org_members FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "members_insert_own" ON org_members;
CREATE POLICY "members_insert_own" ON org_members FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid() AND om.role = 'admin')
  );

DROP POLICY IF EXISTS "members_update_own" ON org_members;
CREATE POLICY "members_update_own" ON org_members FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid() AND om.role = 'admin')
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid() AND om.role = 'admin')
  );

DROP POLICY IF EXISTS "members_delete_own" ON org_members;
CREATE POLICY "members_delete_own" ON org_members FOR DELETE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid() AND om.role = 'admin')
  );

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_own" ON organizations;
CREATE POLICY "org_select_own" ON organizations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = organizations.id AND org_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "org_update_own" ON organizations;
CREATE POLICY "org_update_own" ON organizations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = organizations.id AND org_members.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = organizations.id AND org_members.user_id = auth.uid())
  );

-- ============================================================
-- WHATSAPP CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Connection',
  phone_number text,
  provider text NOT NULL DEFAULT 'baileys' CHECK (provider IN ('baileys', 'whatsapp_cloud')),
  provider_session_id text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'qr_required', 'error')),
  last_connected_at timestamptz,
  last_seen_at timestamptz,
  qr_data text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wa_select_own" ON whatsapp_connections;
CREATE POLICY "wa_select_own" ON whatsapp_connections FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wa_insert_own" ON whatsapp_connections;
CREATE POLICY "wa_insert_own" ON whatsapp_connections FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wa_update_own" ON whatsapp_connections;
CREATE POLICY "wa_update_own" ON whatsapp_connections FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wa_delete_own" ON whatsapp_connections;
CREATE POLICY "wa_delete_own" ON whatsapp_connections FOR DELETE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- ERP INTEGRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  erp_name text NOT NULL,
  whatsapp_connection_id uuid REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
  webhook_url text,
  webhook_secret text,
  default_language text NOT NULL DEFAULT 'en',
  default_template_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE erp_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_select_own" ON erp_integrations;
CREATE POLICY "erp_select_own" ON erp_integrations FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "erp_insert_own" ON erp_integrations;
CREATE POLICY "erp_insert_own" ON erp_integrations FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "erp_update_own" ON erp_integrations;
CREATE POLICY "erp_update_own" ON erp_integrations FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "erp_delete_own" ON erp_integrations;
CREATE POLICY "erp_delete_own" ON erp_integrations FOR DELETE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- API KEYS (stored hashed)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id uuid REFERENCES erp_integrations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apikey_select_own" ON api_keys;
CREATE POLICY "apikey_select_own" ON api_keys FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "apikey_insert_own" ON api_keys;
CREATE POLICY "apikey_insert_own" ON api_keys FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "apikey_update_own" ON api_keys;
CREATE POLICY "apikey_update_own" ON api_keys FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "apikey_delete_own" ON api_keys;
CREATE POLICY "apikey_delete_own" ON api_keys FOR DELETE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- MESSAGE TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  event text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  message text NOT NULL,
  send_pdf boolean NOT NULL DEFAULT false,
  send_document boolean NOT NULL DEFAULT false,
  send_link boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tmpl_select_own" ON message_templates;
CREATE POLICY "tmpl_select_own" ON message_templates FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tmpl_insert_own" ON message_templates;
CREATE POLICY "tmpl_insert_own" ON message_templates FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tmpl_update_own" ON message_templates;
CREATE POLICY "tmpl_update_own" ON message_templates FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tmpl_delete_own" ON message_templates;
CREATE POLICY "tmpl_delete_own" ON message_templates FOR DELETE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- MESSAGE QUEUE (outbox)
-- ============================================================
CREATE TABLE IF NOT EXISTS message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_connection_id uuid REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
  integration_id uuid REFERENCES erp_integrations(id) ON DELETE SET NULL,
  event text NOT NULL,
  recipient text NOT NULL,
  message text,
  document_url text,
  document_name text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'delivered', 'failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  last_error text,
  provider_message_id text,
  idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  queued_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mq_select_own" ON message_queue;
CREATE POLICY "mq_select_own" ON message_queue FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mq_insert_own" ON message_queue;
CREATE POLICY "mq_insert_own" ON message_queue FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mq_update_own" ON message_queue;
CREATE POLICY "mq_update_own" ON message_queue FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mq_delete_own" ON message_queue;
CREATE POLICY "mq_delete_own" ON message_queue FOR DELETE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- MESSAGE LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES message_queue(id) ON DELETE CASCADE,
  status text NOT NULL,
  provider text,
  provider_message_id text,
  error text,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mlog_select_own" ON message_logs;
CREATE POLICY "mlog_select_own" ON message_logs FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mlog_insert_own" ON message_logs;
CREATE POLICY "mlog_insert_own" ON message_logs FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- WEBHOOK LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id uuid REFERENCES erp_integrations(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whlog_select_own" ON webhook_logs;
CREATE POLICY "whlog_select_own" ON webhook_logs FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "whlog_insert_own" ON webhook_logs;
CREATE POLICY "whlog_insert_own" ON webhook_logs FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- CONNECTION LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_connection_id uuid REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  event text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clog_select_own" ON connection_logs;
CREATE POLICY "clog_select_own" ON connection_logs FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "clog_insert_own" ON connection_logs;
CREATE POLICY "clog_insert_own" ON connection_logs FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alog_select_own" ON audit_logs;
CREATE POLICY "alog_select_own" ON audit_logs FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "alog_insert_own" ON audit_logs;
CREATE POLICY "alog_insert_own" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- REPORT DELIVERY TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS report_delivery_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES message_queue(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  report_url text NOT NULL,
  report_type text NOT NULL DEFAULT 'laboratory' CHECK (report_type IN ('laboratory', 'radiology', 'general')),
  expires_at timestamptz NOT NULL,
  is_one_time boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_delivery_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdt_select_own" ON report_delivery_tokens;
CREATE POLICY "rdt_select_own" ON report_delivery_tokens FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "rdt_insert_own" ON report_delivery_tokens;
CREATE POLICY "rdt_insert_own" ON report_delivery_tokens FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "rdt_update_own" ON report_delivery_tokens;
CREATE POLICY "rdt_update_own" ON report_delivery_tokens FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- SETTINGS (key-value per organization)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "set_select_own" ON settings;
CREATE POLICY "set_select_own" ON settings FOR SELECT
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "set_insert_own" ON settings;
CREATE POLICY "set_insert_own" ON settings FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "set_update_own" ON settings;
CREATE POLICY "set_update_own" ON settings FOR UPDATE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  ) WITH CHECK (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "set_delete_own" ON settings;
CREATE POLICY "set_delete_own" ON settings FOR DELETE
  TO authenticated USING (
    organization_id IN (SELECT om.organization_id FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_wa_conn_org ON whatsapp_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_erp_int_org ON erp_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_templates_org ON message_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_mq_org ON message_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_mq_status ON message_queue(status);
CREATE INDEX IF NOT EXISTS idx_mq_idem ON message_queue(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_mq_next_retry ON message_queue(next_retry_at) WHERE status IN ('queued', 'failed');
CREATE INDEX IF NOT EXISTS idx_mlog_org ON message_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_whlog_org ON webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_clog_org ON connection_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_alog_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_rdt_org ON report_delivery_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_rdt_token ON report_delivery_tokens(token);
CREATE INDEX IF NOT EXISTS idx_settings_org ON settings(organization_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trigger_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_whatsapp_conn_updated_at BEFORE UPDATE ON whatsapp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_erp_int_updated_at BEFORE UPDATE ON erp_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_mq_updated_at BEFORE UPDATE ON message_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SOURCE: supabase/migrations/20260922092846_create_org_rpc_function.sql
/*
# Create organization setup RPC function

## Overview
Creates a SECURITY DEFINER function that creates an organization and adds the
user as an admin member. This is needed because new users don't have an
organization yet, and RLS prevents them from inserting into organizations
until they're a member (chicken-and-egg problem).

## New Functions
- create_organization_for_user(p_user_id, p_org_name) → uuid
  Creates an organization with the given name, adds the user as admin member,
  seeds default settings and templates, returns the organization ID.

## Security
- SECURITY DEFINER so it can insert into organizations and org_members
  on behalf of a newly-registered user who doesn't yet have any org membership.
- Only callable by authenticated users.
- The function verifies the calling user matches p_user_id.
*/

CREATE OR REPLACE FUNCTION create_organization_for_user(p_user_id uuid, p_org_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Cannot create organization for another user';
  END IF;

  INSERT INTO organizations (name) VALUES (p_org_name) RETURNING id INTO v_org_id;

  INSERT INTO org_members (organization_id, user_id, role)
  VALUES (v_org_id, p_user_id, 'admin');

  INSERT INTO settings (organization_id, key, value) VALUES
    (v_org_id, 'messaging', '{"welcome_enabled": true, "invoice_enabled": true, "report_ready_enabled": true, "send_report_pdf": true, "send_secure_link": true, "secure_link_expiration_hours": 72, "retry_attempts": 5, "default_language": "en", "default_country": "PK", "business_name": ""}'::jsonb),
    (v_org_id, 'general', '{"default_country_code": "PK"}'::jsonb);

  INSERT INTO message_templates (organization_id, name, event, language, message, send_pdf, send_link) VALUES
    (v_org_id, 'Patient Registration', 'patient_registered', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nThank you for registering with our laboratory.\n\nYour registration has been completed successfully.\n\nPatient ID: {{patient_id}}\n\nYour invoice is attached.\n\nThank you.', true, false),
    (v_org_id, 'Invoice Created', 'invoice_created', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nYour invoice {{invoice_number}} has been generated.\n\nInvoice Date: {{invoice_date}}\n\nYour invoice is attached.\n\nThank you.', true, false),
    (v_org_id, 'Laboratory Report Ready', 'report_ready', 'en', 'Assalam-o-Alaikum {{patient_name}},\n\nYour laboratory report {{report_number}} is now ready.\n\nYou can securely view your report here:\n{{secure_link}}\n\nThank you.', false, true),
    (v_org_id, 'Radiology Report Ready', 'report_ready', 'en', 'Assalam-o-Alaikum {{patient_name}},\n\nYour radiology report {{report_number}} is now ready.\n\nYou can securely view your report here:\n{{secure_link}}\n\nThank you.', false, true),
    (v_org_id, 'Appointment Created', 'appointment_created', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nYour appointment has been scheduled.\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\nDoctor: {{doctor_name}}\n\nThank you.', false, false),
    (v_org_id, 'Appointment Reminder', 'appointment_reminder', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nThis is a reminder for your appointment on {{appointment_date}} at {{appointment_time}}.\n\nThank you.', false, false),
    (v_org_id, 'Appointment Cancelled', 'appointment_cancelled', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nYour appointment on {{appointment_date}} at {{appointment_time}} has been cancelled.\n\nPlease contact us to reschedule.\n\nThank you.', false, false),
    (v_org_id, 'Payment Received', 'payment_received', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nWe have received your payment for invoice {{invoice_number}}.\n\nAmount: {{invoice_amount}}\n\nThank you for your payment.', false, false),
    (v_org_id, 'Payment Pending', 'payment_pending', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nYour payment for invoice {{invoice_number}} is pending.\n\nAmount: {{invoice_amount}}\n\nPlease make the payment at your earliest convenience.\n\nThank you.', false, false),
    (v_org_id, 'Payment Failed', 'payment_failed', 'en', 'Assalam-o-Alaikum {{customer_name}},\n\nYour payment for invoice {{invoice_number}} has failed.\n\nAmount: {{invoice_amount}}\n\nPlease try again or contact us for assistance.\n\nThank you.', false, false),
    (v_org_id, 'Custom Message', 'custom_message', 'en', '{{custom_message}}', false, false);

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_organization_for_user TO authenticated;


-- SOURCE: supabase/migrations/20260922120000_queue_claim_and_security.sql
/*
  Queue locking and RLS hardening for the WhatsApp ERP Gateway.

  The worker uses claim_message_queue() so two worker instances cannot send the
  same queued message at the same time.
*/

CREATE OR REPLACE FUNCTION claim_message_queue(p_limit integer DEFAULT 10)
RETURNS SETOF message_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM message_queue
    WHERE status = 'queued'
      AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY queued_at
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(1, LEAST(p_limit, 100))
  )
  UPDATE message_queue q
  SET status = 'processing',
      attempts = q.attempts + 1,
      updated_at = now()
  FROM candidates c
  WHERE q.id = c.id
  RETURNING q.*;
END;
$$;

REVOKE ALL ON FUNCTION claim_message_queue(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_message_queue(integer) TO service_role;

CREATE INDEX IF NOT EXISTS idx_mq_claim ON message_queue(status, next_retry_at, queued_at);

-- Prevent API clients from calling worker-only queue claim RPC.


-- SOURCE: supabase/migrations/20260922123000_rls_hardening.sql
/*
  RLS hardening.

  The original org_members policies queried org_members from inside policies on
  org_members, which can recurse. A SECURITY DEFINER membership helper avoids
  that recursion while keeping tenant isolation.
*/

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = p_org_id
      AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = p_org_id
      AND user_id = p_user_id
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "members_select_own" ON org_members;
CREATE POLICY "members_select_own" ON org_members FOR SELECT TO authenticated
USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "members_insert_own" ON org_members;
CREATE POLICY "members_insert_own" ON org_members FOR INSERT TO authenticated
WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "members_update_own" ON org_members;
CREATE POLICY "members_update_own" ON org_members FOR UPDATE TO authenticated
USING (public.is_org_admin(organization_id))
WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "members_delete_own" ON org_members;
CREATE POLICY "members_delete_own" ON org_members FOR DELETE TO authenticated
USING (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_select_own" ON organizations;
CREATE POLICY "org_select_own" ON organizations FOR SELECT TO authenticated
USING (public.is_org_member(id));

DROP POLICY IF EXISTS "org_update_own" ON organizations;
CREATE POLICY "org_update_own" ON organizations FOR UPDATE TO authenticated
USING (public.is_org_admin(id))
WITH CHECK (public.is_org_admin(id));


-- SOURCE: supabase/migrations/20260922130000_whatsapp_cloud_api.sql
ALTER TABLE public.whatsapp_connections
  ADD COLUMN IF NOT EXISTS cloud_waba_id text,
  ADD COLUMN IF NOT EXISTS cloud_phone_number_id text,
  ADD COLUMN IF NOT EXISTS cloud_access_token text,
  ADD COLUMN IF NOT EXISTS cloud_verify_token text,
  ADD COLUMN IF NOT EXISTS cloud_app_secret text,
  ADD COLUMN IF NOT EXISTS cloud_api_version text DEFAULT 'v23.0';

CREATE INDEX IF NOT EXISTS idx_wa_cloud_phone ON public.whatsapp_connections(cloud_phone_number_id)
WHERE provider = 'whatsapp_cloud';

CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_cloud_phone_unique
ON public.whatsapp_connections(cloud_phone_number_id)
WHERE provider = 'whatsapp_cloud' AND cloud_phone_number_id IS NOT NULL;


-- SOURCE: supabase/migrations/20260922133000_secure_cloud_credentials.sql
CREATE TABLE IF NOT EXISTS public.whatsapp_cloud_credentials (
  connection_id uuid PRIMARY KEY REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  waba_id text,
  phone_number_id text NOT NULL,
  access_token text NOT NULL,
  verify_token text,
  app_secret text,
  api_version text NOT NULL DEFAULT 'v23.0',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_cloud_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cloud_credentials_no_client_access" ON public.whatsapp_cloud_credentials;
CREATE POLICY "cloud_credentials_no_client_access" ON public.whatsapp_cloud_credentials
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

REVOKE ALL ON public.whatsapp_cloud_credentials FROM anon, authenticated;
GRANT ALL ON public.whatsapp_cloud_credentials TO service_role;

INSERT INTO public.whatsapp_cloud_credentials
(connection_id, organization_id, waba_id, phone_number_id, access_token, verify_token, app_secret, api_version)
SELECT id, organization_id, cloud_waba_id, cloud_phone_number_id, cloud_access_token, cloud_verify_token, cloud_app_secret, COALESCE(cloud_api_version, 'v23.0')
FROM public.whatsapp_connections
WHERE provider = 'whatsapp_cloud'
  AND cloud_phone_number_id IS NOT NULL
  AND cloud_access_token IS NOT NULL
ON CONFLICT (connection_id) DO NOTHING;

ALTER TABLE public.whatsapp_connections
  DROP COLUMN IF EXISTS cloud_waba_id,
  DROP COLUMN IF EXISTS cloud_phone_number_id,
  DROP COLUMN IF EXISTS cloud_access_token,
  DROP COLUMN IF EXISTS cloud_verify_token,
  DROP COLUMN IF EXISTS cloud_app_secret,
  DROP COLUMN IF EXISTS cloud_api_version;


-- SOURCE: supabase/migrations/20260922140000_worker_local_mode.sql
ALTER TABLE public.whatsapp_connections
  ADD COLUMN IF NOT EXISTS worker_enabled boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_wa_worker_enabled
ON public.whatsapp_connections(provider, worker_enabled, status);


-- SOURCE: supabase/migrations/20260922141000_worker_logout_flag.sql
ALTER TABLE public.whatsapp_connections
  ADD COLUMN IF NOT EXISTS force_logout boolean NOT NULL DEFAULT false;


-- SOURCE: supabase/migrations/20260930120000_wasender_integration.sql
-- Add WasenderAPI as a managed WhatsApp provider.
-- Credentials are intentionally kept in a service-role-only table; the browser never reads them.

alter table public.whatsapp_connections
  drop constraint if exists whatsapp_connections_provider_check;

alter table public.whatsapp_connections
  add constraint whatsapp_connections_provider_check
  check (provider in ('baileys', 'whatsapp_cloud', 'wasender'));

create table if not exists public.wasender_credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.whatsapp_connections(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id text not null,
  api_key text not null,
  webhook_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wasender_credentials_org_idx
  on public.wasender_credentials(organization_id);

alter table public.wasender_credentials enable row level security;

revoke all on public.wasender_credentials from anon, authenticated;
grant all on public.wasender_credentials to service_role;

create or replace function public.touch_wasender_credentials_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wasender_credentials_updated_at on public.wasender_credentials;
create trigger wasender_credentials_updated_at
before update on public.wasender_credentials
for each row execute function public.touch_wasender_credentials_updated_at();

