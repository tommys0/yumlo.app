-- Add photo sessions table for persistent storage
-- Run this in your Supabase SQL Editor

-- Create photo_sessions table
CREATE TABLE IF NOT EXISTS photo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'expired')),
  photo_count INTEGER DEFAULT 0,
  photos JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_sessions_session_id ON photo_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_user_id ON photo_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_expires_at ON photo_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_status ON photo_sessions(status);

-- Enable Row Level Security
ALTER TABLE photo_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies - allow access to session data for anonymous and authenticated users
-- This is needed because mobile users might be anonymous
CREATE POLICY "Anyone can read active sessions" ON photo_sessions
  FOR SELECT USING (expires_at > NOW() AND status != 'expired');

CREATE POLICY "Anyone can create sessions" ON photo_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update non-expired sessions" ON photo_sessions
  FOR UPDATE USING (expires_at > NOW() AND status != 'expired');

-- Create function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE photo_sessions
  SET status = 'expired'
  WHERE expires_at < NOW() AND status != 'expired';

  -- Optionally delete very old expired sessions (older than 1 day)
  DELETE FROM photo_sessions
  WHERE expires_at < NOW() - INTERVAL '1 day' AND status = 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to be called by cron job (if available)
-- This would need to be set up separately via Supabase Edge Functions or external cron
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Call this function periodically to clean up expired sessions';