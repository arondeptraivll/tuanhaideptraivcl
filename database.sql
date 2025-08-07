-- ====================================
-- VIETNAM DDOS PROTECTION DATABASE
-- ====================================

-- Tạo table rate_limits với indexing tối ưu
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  request_count INTEGER DEFAULT 0,
  foreign_request_count INTEGER DEFAULT 0,
  violations INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_until TIMESTAMP WITH TIME ZONE,
  reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
  first_foreign_request TIMESTAMP WITH TIME ZONE,
  user_agent_hash VARCHAR(64),
  country_code VARCHAR(2),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes cho performance cao
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_banned ON rate_limits(is_banned, banned_until) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_time) WHERE reset_time > NOW();
CREATE INDEX IF NOT EXISTS idx_rate_limits_activity ON rate_limits(last_activity);
CREATE INDEX IF NOT EXISTS idx_rate_limits_country ON rate_limits(country_code) WHERE country_code != 'VN';

-- Table để log suspicious activities
CREATE TABLE IF NOT EXISTS security_logs (
  id BIGSERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'LOW',
  path VARCHAR(500),
  user_agent TEXT,
  country_code VARCHAR(2),
  headers JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index cho security logs
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity, created_at);

-- Table để cache Vietnam IP ranges
CREATE TABLE IF NOT EXISTS vietnam_ip_ranges (
  id SERIAL PRIMARY KEY,
  start_ip INET NOT NULL,
  end_ip INET NOT NULL,
  start_numeric BIGINT NOT NULL,
  end_numeric BIGINT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index cho IP range lookup
CREATE INDEX IF NOT EXISTS idx_vietnam_ip_numeric ON vietnam_ip_ranges(start_numeric, end_numeric);

-- Function để cleanup old records tự động
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
  -- Xóa rate_limits cũ (7 ngày) và không bị ban
  DELETE FROM rate_limits 
  WHERE last_activity < NOW() - INTERVAL '7 days' 
  AND is_banned = false;
  
  -- Xóa security_logs cũ (30 ngày)
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Unban các IP đã hết thời gian ban
  UPDATE rate_limits 
  SET is_banned = false, banned_until = NULL 
  WHERE is_banned = true 
  AND banned_until IS NOT NULL 
  AND banned_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rate_limits_updated_at 
BEFORE UPDATE ON rate_limits 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - tùy chọn cho bảo mật
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vietnam_ip_ranges ENABLE ROW LEVEL SECURITY;

-- Policy cho service role (full access)
CREATE POLICY "Service role full access on rate_limits" ON rate_limits
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on security_logs" ON security_logs
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on vietnam_ip_ranges" ON vietnam_ip_ranges
FOR ALL USING (auth.role() = 'service_role');
