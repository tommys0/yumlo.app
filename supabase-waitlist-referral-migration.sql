-- Add referral fields to waitlist table
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES waitlist(id);
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0;

-- Create index on referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);

-- Create index on invited_by for faster queries
CREATE INDEX IF NOT EXISTS idx_waitlist_invited_by ON waitlist(invited_by);

-- Function to generate unique waitlist referral code
CREATE OR REPLACE FUNCTION generate_waitlist_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code (shorter for waitlist)
    code := upper(substring(md5(random()::text) from 1 for 6));

    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM waitlist WHERE referral_code = code) INTO exists;

    -- If unique, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on waitlist entry
CREATE OR REPLACE FUNCTION auto_generate_waitlist_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_waitlist_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_waitlist_referral_code
  BEFORE INSERT ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_waitlist_referral_code();

-- Generate referral codes for existing waitlist entries
UPDATE waitlist SET referral_code = generate_waitlist_referral_code() WHERE referral_code IS NULL;
