-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[]; -- Array of restrictions
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT[]; -- Array of allergies
ALTER TABLE users ADD COLUMN IF NOT EXISTS macro_goals JSONB; -- {protein: 150, carbs: 200, fats: 70}
ALTER TABLE users ADD COLUMN IF NOT EXISTS cuisine_preferences TEXT[]; -- Array of preferred cuisines
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Example of macro_goals structure:
-- {
--   "protein": 150,
--   "carbs": 200,
--   "fats": 70,
--   "calories": 2000
-- }
