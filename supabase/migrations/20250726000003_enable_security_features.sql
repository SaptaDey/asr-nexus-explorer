-- CRITICAL SECURITY FIX: Enable Supabase security features
-- This migration configures security settings and rate limiting

-- Create auth security configuration table
CREATE TABLE IF NOT EXISTS auth.security_config (
  id SERIAL PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable security features
INSERT INTO auth.security_config (config_key, config_value) VALUES
  ('password_min_length', '{"value": 12}'::jsonb),
  ('password_require_uppercase', '{"value": true}'::jsonb),
  ('password_require_lowercase', '{"value": true}'::jsonb),
  ('password_require_numbers', '{"value": true}'::jsonb),
  ('password_require_special_chars', '{"value": true}'::jsonb),
  ('enable_signup_rate_limit', '{"value": true}'::jsonb),
  ('signup_rate_limit_per_hour', '{"value": 5}'::jsonb),
  ('enable_login_rate_limit', '{"value": true}'::jsonb),
  ('login_rate_limit_per_hour', '{"value": 10}'::jsonb),
  ('enable_leaked_password_protection', '{"value": true}'::jsonb),
  ('session_timeout_minutes', '{"value": 60}'::jsonb),
  ('enable_mfa', '{"value": false}'::jsonb), -- Will be enabled in Phase 5
  ('enable_email_verification', '{"value": true}'::jsonb)
ON CONFLICT (config_key) DO UPDATE 
SET config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS auth.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- Can be IP address, user_id, etc.
  action TEXT NOT NULL, -- login, signup, api_call, etc.
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient rate limit checks
CREATE INDEX idx_rate_limits_identifier_action ON auth.rate_limits(identifier, action);
CREATE INDEX idx_rate_limits_window ON auth.rate_limits(window_end) WHERE window_end > NOW();

-- Function to check rate limits
CREATE OR REPLACE FUNCTION auth.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count attempts in the current window
  SELECT COALESCE(SUM(attempts), 0) INTO v_attempts
  FROM auth.rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_start >= v_window_start;
  
  -- Check if limit exceeded
  IF v_attempts >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Record this attempt
  INSERT INTO auth.rate_limits (identifier, action, attempts, window_start, window_end)
  VALUES (
    p_identifier, 
    p_action, 
    1, 
    NOW(), 
    NOW() + (p_window_minutes || ' minutes')::INTERVAL
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'auth';

-- Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION auth.cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth.rate_limits
  WHERE window_end < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'auth';

-- Create security audit log table
CREATE TABLE IF NOT EXISTS auth.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_severity TEXT CHECK (event_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient audit log queries
CREATE INDEX idx_security_audit_log_event_type ON auth.security_audit_log(event_type);
CREATE INDEX idx_security_audit_log_user_id ON auth.security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON auth.security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_log_severity ON auth.security_audit_log(event_severity);

-- Function to log security events
CREATE OR REPLACE FUNCTION auth.log_security_event(
  p_event_type TEXT,
  p_event_severity TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
  INSERT INTO auth.security_audit_log (
    event_type, 
    event_severity, 
    user_id, 
    ip_address, 
    user_agent, 
    event_data
  ) VALUES (
    p_event_type,
    p_event_severity,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_event_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'auth';

-- Create blocked IPs table for additional security
CREATE TABLE IF NOT EXISTS auth.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION auth.is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.blocked_ips
    WHERE ip_address = p_ip_address
    AND (blocked_until IS NULL OR blocked_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'auth';

-- Add password validation function
CREATE OR REPLACE FUNCTION auth.validate_password_strength(p_password TEXT)
RETURNS TABLE(is_valid BOOLEAN, errors TEXT[]) AS $$
DECLARE
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_min_length INTEGER;
  v_require_uppercase BOOLEAN;
  v_require_lowercase BOOLEAN;
  v_require_numbers BOOLEAN;
  v_require_special BOOLEAN;
BEGIN
  -- Get password requirements from config
  SELECT (config_value->>'value')::INTEGER INTO v_min_length
  FROM auth.security_config WHERE config_key = 'password_min_length';
  
  SELECT (config_value->>'value')::BOOLEAN INTO v_require_uppercase
  FROM auth.security_config WHERE config_key = 'password_require_uppercase';
  
  SELECT (config_value->>'value')::BOOLEAN INTO v_require_lowercase
  FROM auth.security_config WHERE config_key = 'password_require_lowercase';
  
  SELECT (config_value->>'value')::BOOLEAN INTO v_require_numbers
  FROM auth.security_config WHERE config_key = 'password_require_numbers';
  
  SELECT (config_value->>'value')::BOOLEAN INTO v_require_special
  FROM auth.security_config WHERE config_key = 'password_require_special_chars';
  
  -- Validate password
  IF LENGTH(p_password) < v_min_length THEN
    v_errors := array_append(v_errors, 'Password must be at least ' || v_min_length || ' characters long');
  END IF;
  
  IF v_require_uppercase AND p_password !~ '[A-Z]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  IF v_require_lowercase AND p_password !~ '[a-z]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  IF v_require_numbers AND p_password !~ '[0-9]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one number');
  END IF;
  
  IF v_require_special AND p_password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one special character');
  END IF;
  
  RETURN QUERY SELECT 
    array_length(v_errors, 1) IS NULL,
    v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'auth';

-- Add comment explaining security configuration
COMMENT ON TABLE auth.security_config IS 'Stores security configuration settings for the authentication system';
COMMENT ON TABLE auth.rate_limits IS 'Tracks rate limiting for various actions to prevent abuse';
COMMENT ON TABLE auth.security_audit_log IS 'Comprehensive audit log for all security-related events';
COMMENT ON TABLE auth.blocked_ips IS 'List of blocked IP addresses for enhanced security';