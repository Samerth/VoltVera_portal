-- Verify and create missing BV test tables
-- Run this script to check which tables exist and create any missing ones

-- Check if tables exist and create them if missing
DO $$
BEGIN
    -- Create users_bvTest if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users_bvTest') THEN
        CREATE TABLE users_bvTest AS SELECT * FROM users WHERE 1=0;
        ALTER TABLE users_bvTest ADD PRIMARY KEY (id);
        ALTER TABLE users_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Created users_bvTest table';
    ELSE
        RAISE NOTICE 'users_bvTest table already exists';
    END IF;

    -- Create products_bvTest if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products_bvTest') THEN
        CREATE TABLE products_bvTest AS SELECT * FROM products WHERE 1=0;
        ALTER TABLE products_bvTest ADD PRIMARY KEY (id);
        ALTER TABLE products_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Created products_bvTest table';
    ELSE
        RAISE NOTICE 'products_bvTest table already exists';
    END IF;

    -- Create purchases_bvTest if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchases_bvTest') THEN
        CREATE TABLE purchases_bvTest AS SELECT * FROM purchases WHERE 1=0;
        ALTER TABLE purchases_bvTest ADD PRIMARY KEY (id);
        ALTER TABLE purchases_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Created purchases_bvTest table';
    ELSE
        RAISE NOTICE 'purchases_bvTest table already exists';
    END IF;

    -- Create walletBalances_bvTest if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'walletBalances_bvTest') THEN
        CREATE TABLE walletBalances_bvTest AS SELECT * FROM wallet_balances WHERE 1=0;
        ALTER TABLE walletBalances_bvTest ADD PRIMARY KEY (id);
        ALTER TABLE walletBalances_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Created walletBalances_bvTest table';
    ELSE
        RAISE NOTICE 'walletBalances_bvTest table already exists';
    END IF;

    -- Create transactions_bvTest if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions_bvTest') THEN
        CREATE TABLE transactions_bvTest AS SELECT * FROM transactions WHERE 1=0;
        ALTER TABLE transactions_bvTest ADD PRIMARY KEY (id);
        ALTER TABLE transactions_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Created transactions_bvTest table';
    ELSE
        RAISE NOTICE 'transactions_bvTest table already exists';
    END IF;
END $$;

-- Add indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_bvTest_user_id ON users_bvTest(user_id);
CREATE INDEX IF NOT EXISTS idx_users_bvTest_parent_id ON users_bvTest(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_bvTest_email ON users_bvTest(email);

CREATE INDEX IF NOT EXISTS idx_products_bvTest_category ON products_bvTest(category);
CREATE INDEX IF NOT EXISTS idx_products_bvTest_active ON products_bvTest(is_active);

CREATE INDEX IF NOT EXISTS idx_purchases_bvTest_user_id ON purchases_bvTest(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_bvTest_product_id ON purchases_bvTest(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_bvTest_status ON purchases_bvTest(payment_status);

CREATE INDEX IF NOT EXISTS idx_walletBalances_bvTest_user_id ON walletBalances_bvTest(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_bvTest_user_id ON transactions_bvTest(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bvTest_type ON transactions_bvTest(type);
CREATE INDEX IF NOT EXISTS idx_transactions_bvTest_date ON transactions_bvTest(created_at);

-- Add comments to identify these as test tables
COMMENT ON TABLE users_bvTest IS 'BV Test table - Copy of users table for testing';
COMMENT ON TABLE products_bvTest IS 'BV Test table - Copy of products table for testing';
COMMENT ON TABLE purchases_bvTest IS 'BV Test table - Copy of purchases table for testing';
COMMENT ON TABLE walletBalances_bvTest IS 'BV Test table - Copy of wallet_balances table for testing';
COMMENT ON TABLE transactions_bvTest IS 'BV Test table - Copy of transactions table for testing';

-- Show final status
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users_bvTest', 'products_bvTest', 'purchases_bvTest', 'walletBalances_bvTest', 'transactions_bvTest') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_name IN ('users_bvTest', 'products_bvTest', 'purchases_bvTest', 'walletBalances_bvTest', 'transactions_bvTest')
ORDER BY table_name;
