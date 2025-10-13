-- Create BV Test Tables (Backup tables for testing)
-- These tables are copies of existing tables with _bvTest suffix

-- Create users_bvTest table
CREATE TABLE users_bvTest AS SELECT * FROM users WHERE 1=0; -- Copy structure only
ALTER TABLE users_bvTest ADD PRIMARY KEY (id);
ALTER TABLE users_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create products_bvTest table  
CREATE TABLE products_bvTest AS SELECT * FROM products WHERE 1=0; -- Copy structure only
ALTER TABLE products_bvTest ADD PRIMARY KEY (id);
ALTER TABLE products_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create purchases_bvTest table
CREATE TABLE purchases_bvTest AS SELECT * FROM purchases WHERE 1=0; -- Copy structure only
ALTER TABLE purchases_bvTest ADD PRIMARY KEY (id);
ALTER TABLE purchases_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create walletBalances_bvTest table
CREATE TABLE walletBalances_bvTest AS SELECT * FROM wallet_balances WHERE 1=0; -- Copy structure only
ALTER TABLE walletBalances_bvTest ADD PRIMARY KEY (id);
ALTER TABLE walletBalances_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create transactions_bvTest table
CREATE TABLE transactions_bvTest AS SELECT * FROM transactions WHERE 1=0; -- Copy structure only
ALTER TABLE transactions_bvTest ADD PRIMARY KEY (id);
ALTER TABLE transactions_bvTest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add indexes for performance
CREATE INDEX idx_users_bvTest_user_id ON users_bvTest(user_id);
CREATE INDEX idx_users_bvTest_parent_id ON users_bvTest(parent_id);
CREATE INDEX idx_users_bvTest_email ON users_bvTest(email);

CREATE INDEX idx_products_bvTest_category ON products_bvTest(category);
CREATE INDEX idx_products_bvTest_active ON products_bvTest(is_active);

CREATE INDEX idx_purchases_bvTest_user_id ON purchases_bvTest(user_id);
CREATE INDEX idx_purchases_bvTest_product_id ON purchases_bvTest(product_id);
CREATE INDEX idx_purchases_bvTest_status ON purchases_bvTest(payment_status);

CREATE INDEX idx_walletBalances_bvTest_user_id ON walletBalances_bvTest(user_id);

CREATE INDEX idx_transactions_bvTest_user_id ON transactions_bvTest(user_id);
CREATE INDEX idx_transactions_bvTest_type ON transactions_bvTest(type);
CREATE INDEX idx_transactions_bvTest_date ON transactions_bvTest(created_at);

-- Add comments to identify these as test tables
COMMENT ON TABLE users_bvTest IS 'BV Test table - Copy of users table for testing';
COMMENT ON TABLE products_bvTest IS 'BV Test table - Copy of products table for testing';
COMMENT ON TABLE purchases_bvTest IS 'BV Test table - Copy of purchases table for testing';
COMMENT ON TABLE walletBalances_bvTest IS 'BV Test table - Copy of walletBalances table for testing';
COMMENT ON TABLE transactions_bvTest IS 'BV Test table - Copy of transactions table for testing';
