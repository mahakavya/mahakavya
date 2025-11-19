-- Create monitoring tables for performance metrics, error logs, and system health

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'ms',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health table
CREATE TABLE IF NOT EXISTS system_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_created ON performance_metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_created ON error_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_service_created ON system_health(service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_created ON system_health(created_at DESC);

-- Create a view for latest system health status
CREATE OR REPLACE VIEW latest_system_health AS
SELECT DISTINCT ON (service) 
  service,
  status,
  response_time,
  metadata,
  created_at
FROM system_health
ORDER BY service, created_at DESC;

-- Create a function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS void AS $$
BEGIN
  -- Keep only last 30 days of performance metrics
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Keep only last 90 days of error logs
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Keep only last 7 days of system health checks
  DELETE FROM system_health 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security) if needed
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin access to performance_metrics" ON performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin access to error_logs" ON error_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin access to system_health" ON system_health
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
