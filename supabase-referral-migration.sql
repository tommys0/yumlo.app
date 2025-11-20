-- Add referral fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0;

-- Create index on referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Create index on invited_by for faster queries
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;

    -- If unique, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on user creation
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();

-- Generate referral codes for existing users
UPDATE users SET referral_code = generate_referral_code() WHERE referral_code IS NULL;
