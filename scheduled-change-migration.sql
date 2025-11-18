-- Add field to track scheduled plan changes
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_plan_change TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_change_date TIMESTAMP;

-- Add comment explaining the fields
COMMENT ON COLUMN users.scheduled_plan_change IS 'Price ID of plan to change to at end of billing period';
COMMENT ON COLUMN users.scheduled_change_date IS 'Date when the scheduled plan change will take effect';
