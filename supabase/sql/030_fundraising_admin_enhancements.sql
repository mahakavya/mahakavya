-- Create fundraising campaigns table with admin features
CREATE TABLE IF NOT EXISTS fundraising_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  raised_amount DECIMAL(12,2) DEFAULT 0,
  donor_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'completed', 'rejected', 'flagged')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_score DECIMAL(3,2) DEFAULT 0.5,
  blockchain_verified BOOLEAN DEFAULT FALSE,
  blockchain_hash TEXT,
  creator_id UUID NOT NULL,
  creator_name TEXT NOT NULL,
  creator_email TEXT NOT NULL,
  creator_avatar TEXT,
  creator_verified BOOLEAN DEFAULT FALSE,
  creator_reputation INTEGER DEFAULT 0,
  location TEXT,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  moderation_notes TEXT,
  last_moderated_at TIMESTAMPTZ,
  last_moderated_by TEXT,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  findings TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blockchain records table
CREATE TABLE IF NOT EXISTS blockchain_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  block_number INTEGER,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  integrity_hash TEXT NOT NULL,
  gas_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  moderator_id TEXT NOT NULL,
  automated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for campaigns with creator details
CREATE OR REPLACE VIEW fundraising_campaigns_with_details AS
SELECT 
  fc.*,
  COALESCE(fc.raised_amount / NULLIF(fc.target_amount, 0) * 100, 0) as success_percentage
FROM fundraising_campaigns fc;

-- Create function to get fundraising statistics
CREATE OR REPLACE FUNCTION get_fundraising_stats()
RETURNS TABLE (
  total_campaigns BIGINT,
  pending_campaigns BIGINT,
  active_campaigns BIGINT,
  completed_campaigns BIGINT,
  rejected_campaigns BIGINT,
  flagged_campaigns BIGINT,
  total_raised DECIMAL,
  average_amount DECIMAL,
  success_rate DECIMAL,
  avg_processing_time DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_campaigns,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_campaigns,
    COUNT(*) FILTER (WHERE status = 'active') as active_campaigns,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_campaigns,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_campaigns,
    COUNT(*) FILTER (WHERE status = 'flagged') as flagged_campaigns,
    COALESCE(SUM(raised_amount), 0) as total_raised,
    COALESCE(AVG(raised_amount), 0) as average_amount,
    COALESCE(
      COUNT(*) FILTER (WHERE status = 'completed' AND raised_amount >= target_amount) * 100.0 / 
      NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'active')), 0), 
      0
    ) as success_rate,
    COALESCE(
      AVG(EXTRACT(EPOCH FROM (last_moderated_at - created_at)) / 3600) FILTER (WHERE last_moderated_at IS NOT NULL),
      0
    ) as avg_processing_time
  FROM fundraising_campaigns;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO fundraising_campaigns (
  title, description, category, target_amount, raised_amount, donor_count,
  status, priority, risk_level, ai_score, creator_id, creator_name, creator_email,
  location, end_date
) VALUES 
(
  'Help Build Clean Water Wells in Rural Villages',
  'We are raising funds to build clean water wells in remote villages that lack access to safe drinking water. Your donation will directly impact hundreds of families.',
  'community',
  500000.00,
  125000.00,
  89,
  'active',
  'high',
  'low',
  0.92,
  gen_random_uuid(),
  'Priya Sharma',
  'priya.sharma@example.com',
  'Rajasthan, India',
  NOW() + INTERVAL '30 days'
),
(
  'Emergency Medical Treatment for Child',
  'Our 8-year-old daughter needs urgent heart surgery. We are seeking help from the community to cover the medical expenses.',
  'medical',
  800000.00,
  450000.00,
  156,
  'active',
  'urgent',
  'medium',
  0.78,
  gen_random_uuid(),
  'Rajesh Kumar',
  'rajesh.kumar@example.com',
  'Mumbai, Maharashtra',
  NOW() + INTERVAL '15 days'
),
(
  'Scholarship Fund for Underprivileged Students',
  'Creating a scholarship fund to help bright students from low-income families pursue higher education.',
  'education',
  300000.00,
  75000.00,
  42,
  'pending',
  'medium',
  'low',
  0.85,
  gen_random_uuid(),
  'Dr. Anita Verma',
  'anita.verma@example.com',
  'Delhi, India',
  NOW() + INTERVAL '45 days'
),
(
  'Flood Relief for Affected Families',
  'Recent floods have displaced hundreds of families. We are collecting funds for immediate relief including food, shelter, and medical aid.',
  'disaster',
  1000000.00,
  850000.00,
  234,
  'active',
  'urgent',
  'low',
  0.95,
  gen_random_uuid(),
  'Relief Foundation',
  'contact@relieffoundation.org',
  'Kerala, India',
  NOW() + INTERVAL '10 days'
),
(
  'Suspicious High-Value Campaign',
  'This campaign has been flagged for potential fraud due to inconsistent information and suspicious activity patterns.',
  'medical',
  2000000.00,
  50000.00,
  12,
  'flagged',
  'low',
  'critical',
  0.15,
  gen_random_uuid(),
  'Unknown User',
  'suspicious@example.com',
  'Unknown Location',
  NOW() + INTERVAL '60 days'
);

-- Insert sample AI insights
INSERT INTO ai_insights (content_type, content_id, insight_type, confidence, findings, recommendations, severity) 
SELECT 
  'fundraising_campaign',
  id,
  'fraud_detection',
  CASE 
    WHEN risk_level = 'critical' THEN 0.95
    WHEN risk_level = 'high' THEN 0.80
    WHEN risk_level = 'medium' THEN 0.65
    ELSE 0.40
  END,
  CASE 
    WHEN risk_level = 'critical' THEN ARRAY['Inconsistent creator information', 'Suspicious payment patterns', 'Lack of verification documents']
    WHEN risk_level = 'high' THEN ARRAY['High funding velocity', 'Limited creator history']
    WHEN risk_level = 'medium' THEN ARRAY['Moderate risk indicators detected']
    ELSE ARRAY['Standard risk profile', 'No major concerns identified']
  END,
  CASE 
    WHEN risk_level = 'critical' THEN ARRAY['Immediate manual review required', 'Suspend campaign pending investigation', 'Contact creator for verification']
    WHEN risk_level = 'high' THEN ARRAY['Enhanced monitoring recommended', 'Request additional documentation']
    WHEN risk_level = 'medium' THEN ARRAY['Regular monitoring sufficient', 'Consider verification badge']
    ELSE ARRAY['Standard processing approved', 'Consider for featured campaigns']
  END,
  CASE 
    WHEN risk_level = 'critical' THEN 'critical'
    WHEN risk_level = 'high' THEN 'warning'
    ELSE 'info'
  END
FROM fundraising_campaigns;

-- Insert sample blockchain records
INSERT INTO blockchain_records (content_type, content_id, transaction_hash, block_number, verification_status, integrity_hash)
SELECT 
  'fundraising_campaign',
  id,
  '0x' || encode(sha256(id::text::bytea), 'hex'),
  1000000 + (random() * 100000)::integer,
  CASE 
    WHEN blockchain_verified THEN 'verified'
    ELSE 'pending'
  END,
  encode(sha256((title || description)::bytea), 'hex')
FROM fundraising_campaigns
WHERE blockchain_verified = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_status ON fundraising_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_category ON fundraising_campaigns(category);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_risk_level ON fundraising_campaigns(risk_level);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_creator ON fundraising_campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_created_at ON fundraising_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_content ON ai_insights(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_content ON blockchain_records(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_content ON moderation_actions(content_type, content_id);

-- Enable RLS
ALTER TABLE fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin access)
CREATE POLICY "Admin full access to fundraising_campaigns" ON fundraising_campaigns FOR ALL USING (true);
CREATE POLICY "Admin full access to ai_insights" ON ai_insights FOR ALL USING (true);
CREATE POLICY "Admin full access to blockchain_records" ON blockchain_records FOR ALL USING (true);
CREATE POLICY "Admin full access to moderation_actions" ON moderation_actions FOR ALL USING (true);
