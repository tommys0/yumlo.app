-- Atomic increment function for waitlist referrals (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_waitlist_referrals(referrer_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE waitlist
    SET referrals_count = COALESCE(referrals_count, 0) + 1
    WHERE id = referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_waitlist_referrals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_waitlist_referrals(UUID) TO service_role;
