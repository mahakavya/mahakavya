-- Enterprise Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'enterprise')),
  billing_email TEXT,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  seats INTEGER DEFAULT 5,
  used_seats INTEGER DEFAULT 0,
  custom_branding BOOLEAN DEFAULT FALSE,
  sso_enabled BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  dedicated_support BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  rate_limit INTEGER DEFAULT 1000,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);

-- API Logs
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  api_key_id UUID REFERENCES api_keys(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain Certificates
CREATE TABLE IF NOT EXISTS blockchain_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('verification', 'achievement', 'donation', 'participation')),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  data JSONB DEFAULT '{}'::JSONB,
  blockchain_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE
);

-- Smart Contracts
CREATE TABLE IF NOT EXISTS smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('donation_escrow', 'milestone_payment', 'recurring_subscription', 'reward_distribution')),
  status TEXT NOT NULL DEFAULT 'deployed' CHECK (status IN ('deployed', 'active', 'completed', 'terminated')),
  parties UUID[] NOT NULL,
  conditions JSONB DEFAULT '{}'::JSONB,
  execution_history JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain Transactions (enhanced)
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('user_verification', 'content_verification', 'donation', 'certificate', 'audit_log')),
  entity_id TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  previous_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::JSONB,
  signature TEXT NOT NULL,
  block_height INTEGER NOT NULL,
  gas_used INTEGER,
  network_status TEXT DEFAULT 'confirmed' CHECK (network_status IN ('pending', 'confirmed', 'failed'))
);

-- Internationalization
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'post', 'campaign', 'comment', etc.
  entity_id UUID NOT NULL,
  language_code TEXT NOT NULL, -- 'en', 'hi', 'es', 'fr', etc.
  field_name TEXT NOT NULL, -- 'title', 'description', 'content'
  translated_text TEXT NOT NULL,
  translation_service TEXT, -- 'ai', 'human', 'automatic'
  quality_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, language_code, field_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_api_logs_org ON api_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_blockchain_certs_recipient ON blockchain_certificates(recipient_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_certs_type ON blockchain_certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_status ON smart_contracts(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_entity ON blockchain_transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_type ON blockchain_transactions(type);
CREATE INDEX IF NOT EXISTS idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(language_code);

-- Add RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Organizations: Members can view their own organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Organization Members: Can view members of their organizations
CREATE POLICY "Users can view organization members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- API Keys: Only organization admins can manage
CREATE POLICY "Organization admins can manage API keys"
  ON api_keys FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Certificates: Users can view their own certificates
CREATE POLICY "Users can view their certificates"
  ON blockchain_certificates FOR SELECT
  USING (recipient_id = auth.uid());

-- Translations: Public read, authenticated users can contribute
CREATE POLICY "Anyone can view translations"
  ON translations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add translations"
  ON translations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
