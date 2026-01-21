-- Add usage tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_used_this_period INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS generation_period_start TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_today_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_generations_lifetime INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN users.generations_used_this_period IS 'Number of generations used in current billing period (resets monthly for free users)';
COMMENT ON COLUMN users.generation_period_start IS 'Start of current generation period (for monthly reset calculation)';
COMMENT ON COLUMN users.generations_today IS 'Number of generations today (for daily rate limiting)';
COMMENT ON COLUMN users.generations_today_date IS 'Date of generations_today count (resets when date changes)';
COMMENT ON COLUMN users.total_generations_lifetime IS 'Total generations ever made by this user (for analytics)';

-- Create function to reset daily counter if date changed
CREATE OR REPLACE FUNCTION reset_daily_generations_if_needed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.generations_today_date < CURRENT_DATE THEN
        NEW.generations_today := 0;
        NEW.generations_today_date := CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-reset daily counter
DROP TRIGGER IF EXISTS reset_daily_generations_trigger ON users;
CREATE TRIGGER reset_daily_generations_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION reset_daily_generations_if_needed();

-- Create function to increment generation count atomically
CREATE OR REPLACE FUNCTION increment_generation_count(p_user_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    generations_used INTEGER,
    generations_today INTEGER,
    period_start TIMESTAMPTZ
) AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- Get current user data with lock
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, NOW();
        RETURN;
    END IF;

    -- Reset daily counter if date changed
    IF v_user.generations_today_date < CURRENT_DATE THEN
        v_user.generations_today := 0;
        v_user.generations_today_date := CURRENT_DATE;
    END IF;

    -- Increment counters
    UPDATE users SET
        generations_used_this_period = COALESCE(generations_used_this_period, 0) + 1,
        generations_today = COALESCE(v_user.generations_today, 0) + 1,
        generations_today_date = CURRENT_DATE,
        total_generations_lifetime = COALESCE(total_generations_lifetime, 0) + 1
    WHERE id = p_user_id
    RETURNING
        true,
        generations_used_this_period,
        users.generations_today,
        generation_period_start
    INTO success, generations_used, generations_today, period_start;

    RETURN QUERY SELECT success, generations_used, generations_today, period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly generation count
CREATE OR REPLACE FUNCTION reset_generation_period(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE users SET
        generations_used_this_period = 0,
        generation_period_start = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_generation_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_generation_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION reset_generation_period(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_generation_period(UUID) TO service_role;
