-- Create essential database functions and triggers

-- Create health check function
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_users'::TEXT, COUNT(*)::BIGINT FROM auth.users
  UNION ALL
  SELECT 'total_sessions'::TEXT, COUNT(*)::BIGINT FROM research_sessions
  UNION ALL
  SELECT 'active_sessions_today'::TEXT, COUNT(*)::BIGINT FROM research_sessions 
    WHERE updated_at > CURRENT_DATE
  UNION ALL
  SELECT 'total_nodes'::TEXT, COUNT(*)::BIGINT FROM graph_nodes
  UNION ALL
  SELECT 'total_edges'::TEXT, COUNT(*)::BIGINT FROM graph_edges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user profile trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create input sanitization function
CREATE OR REPLACE FUNCTION sanitize_text_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove potentially dangerous characters and patterns
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '[<>"\''`]', '', 'g'),
      'script|javascript|vbscript|onload|onerror', '', 'gi'
    ),
    '\x00|\x08|\x09|\x1a|\x0d|\x0a', '', 'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_sessions_updated_at ON research_sessions;
CREATE TRIGGER update_research_sessions_updated_at 
  BEFORE UPDATE ON research_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_query_sessions_updated_at ON query_sessions;
CREATE TRIGGER update_query_sessions_updated_at 
  BEFORE UPDATE ON query_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_database_health() TO authenticated;
GRANT EXECUTE ON FUNCTION sanitize_text_input(TEXT) TO authenticated;