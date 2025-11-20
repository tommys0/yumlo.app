-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- Add RLS policies (Row Level Security)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (join waitlist)
CREATE POLICY "Anyone can join waitlist"
ON waitlist
FOR INSERT
TO public
WITH CHECK (true);

-- Only service role can read/update/delete
CREATE POLICY "Service role can manage waitlist"
ON waitlist
FOR ALL
TO service_role
USING (true);
