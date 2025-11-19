-- Database inspection functions for runtime schema checking

-- Function to get table information
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get index information
CREATE OR REPLACE FUNCTION get_index_info()
RETURNS TABLE (
  tablename TEXT,
  indexname TEXT,
  indexdef TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.tablename::TEXT,
    pi.indexname::TEXT,
    pi.indexdef::TEXT
  FROM pg_indexes pi
  WHERE pi.schemaname = 'public'
  ORDER BY pi.tablename, pi.indexname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get RLS policy information
CREATE OR REPLACE FUNCTION get_policy_info()
RETURNS TABLE (
  tablename TEXT,
  policyname TEXT,
  cmd TEXT,
  qual TEXT,
  with_check TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.tablename::TEXT,
    pp.policyname::TEXT,
    pp.cmd::TEXT,
    pp.qual::TEXT,
    pp.with_check::TEXT
  FROM pg_policies pp
  WHERE pp.schemaname = 'public'
  ORDER BY pp.tablename, pp.policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check migration status
CREATE OR REPLACE FUNCTION check_migration_status()
RETURNS TABLE (
  version TEXT,
  status TEXT,
  applied_at TIMESTAMPTZ,
  description TEXT
) AS $$
DECLARE
  expected_migrations TEXT[] := ARRAY[
    '001_schema_complete',
    '002_rls',
    '003_indexes', 
    '004_functions',
    '005_search',
    '006_analytics',
    '007_notifications',
    '008_safety',
    '009_rate_limits',
    '010_push'
  ];
  migration TEXT;
BEGIN
  -- Create migrations table if it doesn't exist
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
  );

  -- Return status for each expected migration
  FOREACH migration IN ARRAY expected_migrations
  LOOP
    RETURN QUERY
    SELECT 
      migration,
      CASE 
        WHEN sm.version IS NOT NULL THEN 'APPLIED'
        ELSE 'PENDING'
      END,
      sm.applied_at,
      sm.description
    FROM (SELECT migration AS version) m
    LEFT JOIN schema_migrations sm ON m.version = sm.version;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate database schema
CREATE OR REPLACE FUNCTION validate_schema()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
  index_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Check table count
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RETURN QUERY SELECT 
    'table_count'::TEXT,
    CASE WHEN table_count >= 20 THEN 'PASS' ELSE 'FAIL' END,
    format('Found %s tables (expected >= 20)', table_count);

  -- Check RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RETURN QUERY SELECT 
    'rls_policies'::TEXT,
    CASE WHEN policy_count >= 10 THEN 'PASS' ELSE 'FAIL' END,
    format('Found %s RLS policies (expected >= 10)', policy_count);

  -- Check indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  RETURN QUERY SELECT 
    'indexes'::TEXT,
    CASE WHEN index_count >= 20 THEN 'PASS' ELSE 'FAIL' END,
    format('Found %s indexes (expected >= 20)', index_count);

  -- Check functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public';
  
  RETURN QUERY SELECT 
    'functions'::TEXT,
    CASE WHEN function_count >= 5 THEN 'PASS' ELSE 'FAIL' END,
    format('Found %s functions (expected >= 5)', function_count);

  -- Check critical tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    RETURN QUERY SELECT 'profiles_table'::TEXT, 'PASS'::TEXT, 'Profiles table exists'::TEXT;
  ELSE
    RETURN QUERY SELECT 'profiles_table'::TEXT, 'FAIL'::TEXT, 'Profiles table missing'::TEXT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts' AND table_schema = 'public') THEN
    RETURN QUERY SELECT 'posts_table'::TEXT, 'PASS'::TEXT, 'Posts table exists'::TEXT;
  ELSE
    RETURN QUERY SELECT 'posts_table'::TEXT, 'FAIL'::TEXT, 'Posts table missing'::TEXT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations' AND table_schema = 'public') THEN
    RETURN QUERY SELECT 'migrations_table'::TEXT, 'PASS'::TEXT, 'Migrations table exists'::TEXT;
  ELSE
    RETURN QUERY SELECT 'migrations_table'::TEXT, 'FAIL'::TEXT, 'Migrations table missing'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark this migration as applied
INSERT INTO schema_migrations (version, description) VALUES
('021_database_inspection_functions', 'Database inspection and validation functions')
ON CONFLICT (version) DO NOTHING;
