-- Migration: Backup Production Tables Before Schema Changes
-- =========================================================
-- This script creates backup tables for all production tables
-- Run this BEFORE applying any schema changes to production

-- Backup users table
CREATE TABLE users_backup AS SELECT * FROM users;
COMMENT ON TABLE users_backup IS 'Backup of users table created before schema changes';

-- Backup pending_recruits table
CREATE TABLE pending_recruits_backup AS SELECT * FROM pending_recruits;
COMMENT ON TABLE pending_recruits_backup IS 'Backup of pending_recruits table created before schema changes';

-- Backup kyc_documents table
CREATE TABLE kyc_documents_backup AS SELECT * FROM kyc_documents;
COMMENT ON TABLE kyc_documents_backup IS 'Backup of kyc_documents table created before schema changes';

-- Backup wallet_balances table
CREATE TABLE wallet_balances_backup AS SELECT * FROM wallet_balances;
COMMENT ON TABLE wallet_balances_backup IS 'Backup of wallet_balances table created before schema changes';

-- Backup transactions table
CREATE TABLE transactions_backup AS SELECT * FROM transactions;
COMMENT ON TABLE transactions_backup IS 'Backup of transactions table created before schema changes';

-- Backup withdrawal_requests table
CREATE TABLE withdrawal_requests_backup AS SELECT * FROM withdrawal_requests;
COMMENT ON TABLE withdrawal_requests_backup IS 'Backup of withdrawal_requests table created before schema changes';

-- Backup purchases table
CREATE TABLE purchases_backup AS SELECT * FROM purchases;
COMMENT ON TABLE purchases_backup IS 'Backup of purchases table created before schema changes';

-- Backup products table
CREATE TABLE products_backup AS SELECT * FROM products;
COMMENT ON TABLE products_backup IS 'Backup of products table created before schema changes';

-- Backup rank_achievements table
CREATE TABLE rank_achievements_backup AS SELECT * FROM rank_achievements;
COMMENT ON TABLE rank_achievements_backup IS 'Backup of rank_achievements table created before schema changes';

-- Backup franchise_requests table
CREATE TABLE franchise_requests_backup AS SELECT * FROM franchise_requests;
COMMENT ON TABLE franchise_requests_backup IS 'Backup of franchise_requests table created before schema changes';

-- Backup support_tickets table
CREATE TABLE support_tickets_backup AS SELECT * FROM support_tickets;
COMMENT ON TABLE support_tickets_backup IS 'Backup of support_tickets table created before schema changes';

-- Backup notifications table
CREATE TABLE notifications_backup AS SELECT * FROM notifications;
COMMENT ON TABLE notifications_backup IS 'Backup of notifications table created before schema changes';

-- Backup referral_links table
CREATE TABLE referral_links_backup AS SELECT * FROM referral_links;
COMMENT ON TABLE referral_links_backup IS 'Backup of referral_links table created before schema changes';

-- Backup email_tokens table
CREATE TABLE email_tokens_backup AS SELECT * FROM email_tokens;
COMMENT ON TABLE email_tokens_backup IS 'Backup of email_tokens table created before schema changes';

-- Create backup metadata table to track backup information
CREATE TABLE IF NOT EXISTS backup_metadata (
    id SERIAL PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_date TIMESTAMP DEFAULT NOW(),
    tables_backed_up TEXT[],
    migration_version VARCHAR(50),
    notes TEXT
);

-- Insert backup record
INSERT INTO backup_metadata (
    backup_name, 
    tables_backed_up, 
    migration_version, 
    notes
) VALUES (
    'Pre-schema-changes-backup',
    ARRAY[
        'users', 'pending_recruits', 'kyc_documents', 'wallet_balances', 
        'transactions', 'withdrawal_requests', 'purchases', 'products',
        'rank_achievements', 'franchise_requests', 'support_tickets', 
        'notifications', 'referral_links', 'email_tokens'
    ],
    '0002',
    'Backup created before applying schema changes for KYC fixes, fund requests, and multi-child tree structure'
);

-- Verify backup tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE '%_backup'
ORDER BY tablename;

-- Show backup metadata
SELECT * FROM backup_metadata ORDER BY backup_date DESC LIMIT 5;
