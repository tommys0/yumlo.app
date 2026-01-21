-- Migration: Create inventory table for user's home ingredients
-- Run this in your Supabase SQL Editor

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2),
    unit TEXT,
    category TEXT,
    expiration_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_expiration ON inventory(user_id, expiration_date);
CREATE INDEX IF NOT EXISTS idx_inventory_user_category ON inventory(user_id, category);

-- Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can create own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory;

-- Users can only view their own inventory
CREATE POLICY "Users can view own inventory" ON inventory
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own inventory items
CREATE POLICY "Users can create own inventory" ON inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own inventory items
CREATE POLICY "Users can update own inventory" ON inventory
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own inventory items
CREATE POLICY "Users can delete own inventory" ON inventory
    FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_updated_at();
