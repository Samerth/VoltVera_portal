-- Create BV Test Tables with correct lowercase names
-- PostgreSQL converts table names to lowercase automatically

-- Create users_bvtest table
CREATE TABLE users_bvtest AS SELECT * FROM users WHERE 1=0; -- Copy structure only
ALTER TABLE users_bvtest ADD PRIMARY KEY (id);
ALTER TABLE users_bvtest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create products_bvtest table  
CREATE TABLE products_bvtest AS SELECT * FROM products WHERE 1=0; -- Copy structure only
ALTER TABLE products_bvtest ADD PRIMARY KEY (id);
ALTER TABLE products_bvtest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create purchases_bvtest table
CREATE TABLE purchases_bvtest AS SELECT * FROM purchases WHERE 1=0; -- Copy structure only
ALTER TABLE purchases_bvtest ADD PRIMARY KEY (id);
ALTER TABLE purchases_bvtest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create walletbalances_bvtest table
CREATE TABLE walletbalances_bvtest AS SELECT * FROM wallet_balances WHERE 1=0; -- Copy structure only
ALTER TABLE walletbalances_bvtest ADD PRIMARY KEY (id);
ALTER TABLE walletbalances_bvtest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create transactions_bvtest table
CREATE TABLE transactions_bvtest AS SELECT * FROM transactions WHERE 1=0; -- Copy structure only
ALTER TABLE transactions_bvtest ADD PRIMARY KEY (id);
ALTER TABLE transactions_bvtest ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add indexes for performance
CREATE INDEX idx_users_bvtest_user_id ON users_bvtest(user_id);
CREATE INDEX idx_users_bvtest_parent_id ON users_bvtest(parent_id);
CREATE INDEX idx_users_bvtest_email ON users_bvtest(email);

CREATE INDEX idx_products_bvtest_category ON products_bvtest(category);
CREATE INDEX idx_products_bvtest_active ON products_bvtest(is_active);

CREATE INDEX idx_purchases_bvtest_user_id ON purchases_bvtest(user_id);
CREATE INDEX idx_purchases_bvtest_product_id ON purchases_bvtest(product_id);
CREATE INDEX idx_purchases_bvtest_status ON purchases_bvtest(payment_status);

CREATE INDEX idx_walletbalances_bvtest_user_id ON walletbalances_bvtest(user_id);

CREATE INDEX idx_transactions_bvtest_user_id ON transactions_bvtest(user_id);
CREATE INDEX idx_transactions_bvtest_type ON transactions_bvtest(type);
CREATE INDEX idx_transactions_bvtest_date ON transactions_bvtest(created_at);

-- Add comments to identify these as test tables
COMMENT ON TABLE users_bvtest IS 'BV Test table - Copy of users table for testing';
COMMENT ON TABLE products_bvtest IS 'BV Test table - Copy of products table for testing';
COMMENT ON TABLE purchases_bvtest IS 'BV Test table - Copy of purchases table for testing';
COMMENT ON TABLE walletbalances_bvtest IS 'BV Test table - Copy of wallet_balances table for testing';
COMMENT ON TABLE transactions_bvtest IS 'BV Test table - Copy of transactions table for testing';
