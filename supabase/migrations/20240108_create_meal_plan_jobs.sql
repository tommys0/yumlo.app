-- Migration: Create meal_plan_jobs table for async meal plan generation
-- Run this in your Supabase SQL Editor

-- Create enum for job status
DO $$ BEGIN
    CREATE TYPE meal_plan_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create meal_plan_jobs table
CREATE TABLE IF NOT EXISTS meal_plan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status meal_plan_job_status NOT NULL DEFAULT 'pending',
    params JSONB NOT NULL,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_meal_plan_jobs_user_id ON meal_plan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_jobs_status_created ON meal_plan_jobs(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_meal_plan_jobs_processing ON meal_plan_jobs(status, processing_started_at) WHERE status = 'processing';

-- Row Level Security
ALTER TABLE meal_plan_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own jobs" ON meal_plan_jobs;
DROP POLICY IF EXISTS "Users can create own jobs" ON meal_plan_jobs;
DROP POLICY IF EXISTS "Service role full access" ON meal_plan_jobs;

-- Users can only view their own jobs
CREATE POLICY "Users can view own jobs" ON meal_plan_jobs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can create own jobs" ON meal_plan_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for background processing)
CREATE POLICY "Service role full access" ON meal_plan_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meal_plan_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_meal_plan_jobs_updated_at ON meal_plan_jobs;
CREATE TRIGGER update_meal_plan_jobs_updated_at
    BEFORE UPDATE ON meal_plan_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_jobs_updated_at();

-- Create or replace atomic increment function for referrals
-- This fixes the race condition in the webhook
CREATE OR REPLACE FUNCTION increment_referrals_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE users
    SET referrals_count = COALESCE(referrals_count, 0) + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_referrals_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_referrals_count(UUID) TO service_role;
