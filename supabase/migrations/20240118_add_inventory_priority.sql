-- Add priority field to inventory table
-- Allows users to mark items they want to use first

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT false;

-- Index for efficient priority queries
CREATE INDEX IF NOT EXISTS idx_inventory_user_priority ON inventory(user_id, priority) WHERE priority = true;

-- Comment for documentation
COMMENT ON COLUMN inventory.priority IS 'User-set flag to prioritize using this ingredient first';
