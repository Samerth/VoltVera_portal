-- Migration: Add order field to users table for multi-child MLM system
-- =================================================================

-- Add order column to users table for multi-child tree structure
ALTER TABLE users 
ADD COLUMN "order" INTEGER DEFAULT 0;

-- Add comment to document the column purpose
COMMENT ON COLUMN users."order" IS 'Order within position (0, 1, 2...N) for multi-child MLM system';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "IDX_users_order" ON users("order");

-- Verify the column was added successfully (for manual verification)
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'order';
