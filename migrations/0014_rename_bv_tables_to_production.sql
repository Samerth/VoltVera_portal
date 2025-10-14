-- Rename BV test tables to production tables
-- This migration converts the test BV infrastructure to production-ready tables

-- Rename BV calculation tables (remove _bvtest suffix)
ALTER TABLE lifetime_bv_calculations_bvtest RENAME TO lifetime_bv_calculations;
ALTER TABLE monthly_bv_bvtest RENAME TO monthly_bv;
ALTER TABLE bv_transactions_bvtest RENAME TO bv_transactions;

-- Rename main test tables to production
ALTER TABLE users_bvtest RENAME TO users_bv_backup;
ALTER TABLE products_bvtest RENAME TO products_bv_backup;
ALTER TABLE purchases_bvtest RENAME TO purchases_bv_backup;
ALTER TABLE walletbalances_bvtest RENAME TO walletbalances_bv_backup;
ALTER TABLE transactions_bvtest RENAME TO transactions_bv_backup;

-- Update foreign key constraints to reference main production tables
-- Drop the old foreign key constraint
ALTER TABLE lifetime_bv_calculations DROP CONSTRAINT IF EXISTS fk_bv_calculations_user_bvtest;

-- Add new foreign key constraint to reference main users table
ALTER TABLE lifetime_bv_calculations ADD CONSTRAINT fk_bv_calculations_user 
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Update indexes to remove _bvtest suffix
DROP INDEX IF EXISTS idx_lifetime_bv_calculations_bvtest_user_id;
DROP INDEX IF EXISTS idx_lifetime_bv_calculations_bvtest_parent_id;
DROP INDEX IF EXISTS idx_monthly_bv_bvtest_user_id;
DROP INDEX IF EXISTS idx_monthly_bv_bvtest_month_id;
DROP INDEX IF EXISTS idx_bv_transactions_bvtest_user_id;
DROP INDEX IF EXISTS idx_bv_transactions_bvtest_purchase_id;
DROP INDEX IF EXISTS idx_bv_transactions_bvtest_month_id;

-- Create new indexes with production names
CREATE INDEX idx_lifetime_bv_calculations_user_id ON lifetime_bv_calculations(user_id);
CREATE INDEX idx_lifetime_bv_calculations_parent_id ON lifetime_bv_calculations(parent_id);
CREATE INDEX idx_monthly_bv_user_id ON monthly_bv(user_id);
CREATE INDEX idx_monthly_bv_month_id ON monthly_bv(month_id);
CREATE INDEX idx_bv_transactions_user_id ON bv_transactions(user_id);
CREATE INDEX idx_bv_transactions_purchase_id ON bv_transactions(purchase_id);
CREATE INDEX idx_bv_transactions_month_id ON bv_transactions(month_id);

-- Update primary key constraints to remove _bvtest references
-- (These should already be correct, but let's ensure they're clean)

-- Add comments to document the production tables
COMMENT ON TABLE lifetime_bv_calculations IS 'Production BV calculations for matching income tracking';
COMMENT ON TABLE monthly_bv IS 'Monthly BV tracking for settlement and reporting';
COMMENT ON TABLE bv_transactions IS 'Audit trail for all BV-related transactions and calculations';

-- Add comments to key columns
COMMENT ON COLUMN lifetime_bv_calculations.left_bv IS 'Total left leg BV (from left side of binary tree)';
COMMENT ON COLUMN lifetime_bv_calculations.right_bv IS 'Total right leg BV (from right side of binary tree)';
COMMENT ON COLUMN lifetime_bv_calculations.matching_bv IS 'Matched BV amount (min of left and right)';
COMMENT ON COLUMN lifetime_bv_calculations.new_match IS 'New matching BV amount from latest purchase';
COMMENT ON COLUMN lifetime_bv_calculations.diff_income IS 'Differential income earned from matching BV';
COMMENT ON COLUMN lifetime_bv_calculations.carry_forward_left IS 'Unmatched BV carried forward on left leg';
COMMENT ON COLUMN lifetime_bv_calculations.carry_forward_right IS 'Unmatched BV carried forward on right leg';


