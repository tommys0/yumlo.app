-- Add columns for tracking scheduled plan changes (downgrades)
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_plan_change TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_change_date TIMESTAMPTZ;

-- Add a comment explaining the columns
COMMENT ON COLUMN users.scheduled_plan_change IS 'Price ID of the plan the user is scheduled to downgrade to';
COMMENT ON COLUMN users.scheduled_change_date IS 'Date when the scheduled plan change will take effect (end of billing period)';
