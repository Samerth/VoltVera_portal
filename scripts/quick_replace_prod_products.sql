-- =====================================================
-- QUICK SCRIPT: Replace Production Products with Dev Products
-- =====================================================
-- This is a simplified version for quick execution
-- USE WITH CAUTION - NO AUTOMATIC BACKUP
-- =====================================================

-- Quick backup (optional - uncomment if you want backup)
-- CREATE TABLE products_backup_quick AS SELECT * FROM products;

-- Clear and replace products
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- Copy from dev table (adjust table name as needed)
INSERT INTO products (
    id, name, description, price, bv, gst, 
    sponsor_income_percentage, category, purchase_type, 
    image_url, is_active, created_at, updated_at
)
SELECT 
    id, name, description, price, bv, gst,
    COALESCE(sponsor_income_percentage, '10.00'),
    category, purchase_type, image_url, is_active, 
    created_at, updated_at
FROM products_bv_test; -- Change to products_bvTest if needed

-- Verify
SELECT COUNT(*) as new_product_count FROM products;
SELECT name, price, category FROM products LIMIT 5;
