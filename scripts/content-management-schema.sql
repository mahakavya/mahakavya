-- Content Management Tables
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('post', 'reel', 'comment')),
  content_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content_text TEXT,
  media_urls TEXT[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_score DECIMAL(3,2) DEFAULT 0.00,
  blockchain_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis Results
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  toxicity_score DECIMAL(3,2) DEFAULT 0.00,
  sentiment_score DECIMAL(3,2) DEFAULT 0.00,
  category VARCHAR(50),
  confidence DECIMAL(3,2) DEFAULT 0.00,
  flags TEXT[],
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain Verification
CREATE TABLE IF NOT EXISTS blockchain_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  transaction_hash VARCHAR(66),
  block_number BIGINT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  integrity_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPA Automation Jobs
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  parameters JSONB,
  results JSONB,
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Moderation Actions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  moderator_id UUID REFERENCES profiles(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'hide', 'delete')),
  reason TEXT,
  automated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_risk_level ON content_items(risk_level);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_content_item ON ai_analysis(content_item_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_content_item ON blockchain_records(content_item_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);

-- Insert sample data for testing
INSERT INTO content_items (type, content_id, author_id, content_text, media_urls, status, risk_level, ai_score) VALUES
('post', gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Beautiful sunset at the beach today! #nature #photography #blessed', ARRAY['/beach-sunset.png'], 'approved', 'low', 0.15),
('reel', gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Check out my new dance routine! 💃 #dance #trending #viral', ARRAY['/dance-routine-video.png', '/dance-thumbnail.png'], 'pending', 'medium', 0.45),
('post', gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'URGENT!!! Make money fast with this cryptocurrency scheme! Click link below!!!', NULL, 'flagged', 'high', 0.85),
('reel', gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Promoting my new crypto investment opportunity! 🚀💰', ARRAY['/cryptocurrency-promotion.png', '/crypto-thumbnail.png'], 'rejected', 'critical', 0.92),
('post', gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Sharing some wisdom from ancient Sanskrit texts. Knowledge is the greatest wealth. 📚✨', NULL, 'approved', 'low', 0.05);

-- Insert sample AI analysis data
INSERT INTO ai_analysis (content_item_id, toxicity_score, sentiment_score, category, confidence, flags, recommendations)
SELECT 
  id,
  CASE 
    WHEN risk_level = 'low' THEN 0.1
    WHEN risk_level = 'medium' THEN 0.4
    WHEN risk_level = 'high' THEN 0.8
    ELSE 0.9
  END,
  CASE 
    WHEN risk_level = 'low' THEN 0.7
    WHEN risk_level = 'medium' THEN 0.2
    WHEN risk_level = 'high' THEN -0.5
    ELSE -0.8
  END,
  CASE 
    WHEN risk_level = 'low' THEN 'positive'
    WHEN risk_level = 'medium' THEN 'neutral'
    WHEN risk_level = 'high' THEN 'spam'
    ELSE 'scam'
  END,
  CASE 
    WHEN risk_level = 'low' THEN 0.9
    WHEN risk_level = 'medium' THEN 0.7
    WHEN risk_level = 'high' THEN 0.85
    ELSE 0.95
  END,
  CASE 
    WHEN risk_level = 'low' THEN ARRAY['positive_content']
    WHEN risk_level = 'medium' THEN ARRAY['needs_review']
    WHEN risk_level = 'high' THEN ARRAY['spam', 'suspicious_links']
    ELSE ARRAY['scam', 'financial_fraud', 'urgent_action_required']
  END,
  CASE 
    WHEN risk_level = 'low' THEN 'Content meets community guidelines'
    WHEN risk_level = 'medium' THEN 'Monitor for engagement patterns'
    WHEN risk_level = 'high' THEN 'Requires immediate manual review'
    ELSE 'Block immediately and investigate user'
  END
FROM content_items;

-- Insert sample blockchain records
INSERT INTO blockchain_records (content_item_id, transaction_hash, block_number, verification_status, integrity_hash)
SELECT 
  id,
  '0x' || encode(gen_random_bytes(32), 'hex'),
  1000000 + floor(random() * 100000)::int,
  'verified',
  encode(gen_random_bytes(32), 'hex')
FROM content_items;

-- Insert sample automation jobs
INSERT INTO automation_jobs (job_type, status, parameters, results, progress, started_at, completed_at) VALUES
('bulk_moderation', 'completed', '{"contentIds": ["sample"], "criteria": {"autoApprove": true}}', '{"processed": 150, "approved": 120, "rejected": 20, "flagged": 10}', 100, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
('content_scan', 'running', '{"filters": {"riskLevel": ["high", "critical"]}}', NULL, 65, NOW() - INTERVAL '30 minutes', NULL),
('duplicate_detection', 'queued', '{"contentType": "post"}', NULL, 0, NULL, NULL);

-- Insert sample moderation actions
INSERT INTO moderation_actions (content_item_id, moderator_id, action, reason, automated)
SELECT 
  id,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  CASE 
    WHEN status = 'approved' THEN 'approve'
    WHEN status = 'rejected' THEN 'reject'
    WHEN status = 'flagged' THEN 'flag'
    ELSE 'approve'
  END,
  CASE 
    WHEN status = 'approved' THEN 'Content meets community guidelines'
    WHEN status = 'rejected' THEN 'Violates community guidelines - spam/scam content'
    WHEN status = 'flagged' THEN 'Requires manual review - suspicious content'
    ELSE 'Automated approval'
  END,
  CASE WHEN risk_level IN ('low', 'medium') THEN true ELSE false END
FROM content_items;

-- Create functions for content management
CREATE OR REPLACE FUNCTION update_content_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_items_timestamp
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_item_timestamp();

-- Function to get content statistics
CREATE OR REPLACE FUNCTION get_content_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'flagged', COUNT(*) FILTER (WHERE status = 'flagged'),
    'riskDistribution', json_build_object(
      'low', COUNT(*) FILTER (WHERE risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE risk_level = 'critical')
    ),
    'processingTime', 1.2
  ) INTO result
  FROM content_items;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to moderate content
CREATE OR REPLACE FUNCTION moderate_content(
  p_content_id UUID,
  p_moderator_id UUID,
  p_action VARCHAR(20),
  p_reason TEXT DEFAULT NULL,
  p_automated BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update content status
  UPDATE content_items 
  SET status = CASE 
    WHEN p_action = 'approve' THEN 'approved'
    WHEN p_action = 'reject' THEN 'rejected'
    WHEN p_action = 'flag' THEN 'flagged'
    ELSE status
  END,
  updated_at = NOW()
  WHERE id = p_content_id;
  
  -- Insert moderation action
  INSERT INTO moderation_actions (content_item_id, moderator_id, action, reason, automated)
  VALUES (p_content_id, p_moderator_id, p_action, p_reason, p_automated);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk moderate content
CREATE OR REPLACE FUNCTION bulk_moderate_content(
  p_content_ids UUID[],
  p_moderator_id UUID,
  p_action VARCHAR(20),
  p_reason TEXT DEFAULT NULL,
  p_automated BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  success_count INTEGER := 0;
  error_count INTEGER := 0;
  content_id UUID;
BEGIN
  FOREACH content_id IN ARRAY p_content_ids
  LOOP
    BEGIN
      PERFORM moderate_content(content_id, p_moderator_id, p_action, p_reason, p_automated);
      success_count := success_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', success_count,
    'failed', error_count,
    'total', array_length(p_content_ids, 1)
  );
END;
$$ LANGUAGE plpgsql;

-- Create view for content with analysis
CREATE OR REPLACE VIEW content_with_analysis AS
SELECT 
  ci.*,
  aa.toxicity_score,
  aa.sentiment_score,
  aa.category,
  aa.confidence,
  aa.flags,
  aa.recommendations,
  br.transaction_hash,
  br.verification_status,
  br.integrity_hash,
  p.name as author_name,
  p.avatar_url as author_avatar
FROM content_items ci
LEFT JOIN ai_analysis aa ON ci.id = aa.content_item_id
LEFT JOIN blockchain_records br ON ci.id = br.content_item_id
LEFT JOIN profiles p ON ci.author_id = p.id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON content_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blockchain_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON moderation_actions TO authenticated;
GRANT SELECT ON content_with_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION moderate_content(UUID, UUID, VARCHAR, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_moderate_content(UUID[], UUID, VARCHAR, TEXT, BOOLEAN) TO authenticated;

-- Create RLS policies
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Content items policies
CREATE POLICY "Users can view all content items" ON content_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage content items" ON content_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own content" ON content_items FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid()
);

-- AI analysis policies
CREATE POLICY "Users can view AI analysis" ON ai_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage AI analysis" ON ai_analysis FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Blockchain records policies
CREATE POLICY "Users can view blockchain records" ON blockchain_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage blockchain records" ON blockchain_records FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Automation jobs policies
CREATE POLICY "Admins can manage automation jobs" ON automation_jobs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Moderation actions policies
CREATE POLICY "Users can view moderation actions" ON moderation_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage moderation actions" ON moderation_actions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_items_author_id ON content_items(author_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_ai_score ON content_items(ai_score);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_toxicity_score ON ai_analysis(toxicity_score);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_sentiment_score ON ai_analysis(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_verification_status ON blockchain_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator_id ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_action ON moderation_actions(action);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_job_type ON automation_jobs(job_type);

-- Create materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS content_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  type,
  status,
  risk_level,
  COUNT(*) as count,
  AVG(ai_score) as avg_ai_score
FROM content_items
GROUP BY DATE_TRUNC('day', created_at), type, status, risk_level;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_analytics_unique 
ON content_analytics(date, type, status, risk_level);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_content_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY content_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh analytics periodically
CREATE OR REPLACE FUNCTION trigger_refresh_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh analytics in background (you might want to use pg_cron for this)
  PERFORM refresh_content_analytics();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_analytics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content_items
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_analytics();

COMMIT;
