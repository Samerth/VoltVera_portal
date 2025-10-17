-- =====================================================
-- SCRIPT: Replace Production Products with Dev Products
-- =====================================================
-- This script replaces production products table data 
-- with development/test products table data
-- 
-- IMPORTANT: 
-- 1. BACKUP your production data before running this script
-- 2. Test this script in a staging environment first
-- 3. Ensure you have the correct source table name
-- =====================================================

-- Step 1: Create backup of current production products
-- =====================================================
DROP TABLE IF EXISTS products_backup_before_dev_replace;
CREATE TABLE products_backup_before_dev_replace AS 
SELECT * FROM products;

-- Add timestamp to backup table
ALTER TABLE products_backup_before_dev_replace 
ADD COLUMN backup_created_at TIMESTAMP DEFAULT NOW();

COMMENT ON TABLE products_backup_before_dev_replace IS 'Backup of production products before replacing with dev data - Created at: ' || NOW();

-- Step 2: Check which dev/test table exists and has data
-- =====================================================
DO $$
DECLARE
    dev_table_exists BOOLEAN := FALSE;
    dev_table_name TEXT := '';
    dev_record_count INTEGER := 0;
BEGIN
    -- Check if products_bv_test exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products_bv_test') THEN
        dev_table_name := 'products_bv_test';
        EXECUTE format('SELECT COUNT(*) FROM %I', dev_table_name) INTO dev_record_count;
        
        IF dev_record_count > 0 THEN
            dev_table_exists := TRUE;
            RAISE NOTICE 'Found products_bv_test table with % records', dev_record_count;
        ELSE
            RAISE NOTICE 'products_bv_test table exists but is empty';
        END IF;
    END IF;
    
    -- If products_bv_test doesn't exist or is empty, check products_bvTest
    IF NOT dev_table_exists THEN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products_bvTest') THEN
            dev_table_name := 'products_bvTest';
            EXECUTE format('SELECT COUNT(*) FROM %I', dev_table_name) INTO dev_record_count;
            
            IF dev_record_count > 0 THEN
                dev_table_exists := TRUE;
                RAISE NOTICE 'Found products_bvTest table with % records', dev_record_count;
            ELSE
                RAISE NOTICE 'products_bvTest table exists but is empty';
            END IF;
        END IF;
    END IF;
    
    -- If no dev table found or empty, abort
    IF NOT dev_table_exists THEN
        RAISE EXCEPTION 'No development products table found with data. Please ensure products_bv_test or products_bvTest exists and contains data.';
    END IF;
    
    RAISE NOTICE 'Using development table: % with % records', dev_table_name, dev_record_count;
END $$;

-- Step 3: Clear current production products table
-- =====================================================
-- Disable foreign key constraints temporarily (if any exist)
-- Note: This is safe for products table as it's typically referenced by other tables
-- but not referencing other tables itself

-- Clear the production products table
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

RAISE NOTICE 'Cleared production products table';

-- Step 4: Copy dev data to production products table
-- =====================================================
-- We'll use a dynamic approach to handle both possible table names
DO $$
DECLARE
    dev_table_name TEXT := '';
    sql_command TEXT := '';
BEGIN
    -- Determine which dev table to use
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products_bv_test') AND 
       (SELECT COUNT(*) FROM products_bv_test) > 0 THEN
        dev_table_name := 'products_bv_test';
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products_bvTest') AND 
          (SELECT COUNT(*) FROM products_bvTest) > 0 THEN
        dev_table_name := 'products_bvTest';
    ELSE
        RAISE EXCEPTION 'No suitable development products table found';
    END IF;
    
    -- Build and execute the INSERT command
    sql_command := format('
        INSERT INTO products (
            id, name, description, price, bv, gst, 
            sponsor_income_percentage, category, purchase_type, 
            image_url, is_active, created_at, updated_at
        )
        SELECT 
            id, name, description, price, bv, gst,
            COALESCE(sponsor_income_percentage, ''10.00''), -- Default to 10% if null
            category, purchase_type, image_url, is_active, 
            created_at, updated_at
        FROM %I', dev_table_name);
    
    EXECUTE sql_command;
    
    RAISE NOTICE 'Successfully copied data from % to production products table', dev_table_name;
    
    -- Get count of inserted records
    EXECUTE format('SELECT COUNT(*) FROM %I', dev_table_name) INTO dev_record_count;
    RAISE NOTICE 'Inserted % records into production products table', dev_record_count;
END $$;

-- Step 5: Verify the data replacement
-- =====================================================
DO $$
DECLARE
    prod_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO prod_count FROM products;
    SELECT COUNT(*) INTO backup_count FROM products_backup_before_dev_replace;
    
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Original production products count: %', backup_count;
    RAISE NOTICE 'New production products count: %', prod_count;
    
    IF prod_count > 0 THEN
        RAISE NOTICE '✅ Data replacement completed successfully';
    ELSE
        RAISE EXCEPTION '❌ Data replacement failed - production products table is empty';
    END IF;
END $$;

-- Step 6: Show sample of new products data
-- =====================================================
RAISE NOTICE '=== SAMPLE OF NEW PRODUCTS DATA ===';
SELECT 
    id,
    name,
    price,
    bv,
    category,
    purchase_type,
    is_active,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 7: Update sequences and constraints
-- =====================================================
-- Ensure the sequence for products table is updated
SELECT setval(pg_get_serial_sequence('products', 'id'), 
              (SELECT MAX(CAST(id AS BIGINT)) FROM products WHERE id ~ '^[0-9]+$'), 
              false);

-- If using UUID, this step can be skipped as UUIDs are auto-generated

-- Step 8: Create summary report
-- =====================================================
DO $$
DECLARE
    total_products INTEGER;
    active_products INTEGER;
    categories TEXT;
    avg_price NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COUNT(*) INTO active_products FROM products WHERE is_active = true;
    
    SELECT string_agg(DISTINCT category, ', ') INTO categories FROM products;
    
    SELECT ROUND(AVG(CAST(price AS NUMERIC)), 2) INTO avg_price FROM products;
    
    RAISE NOTICE '=== REPLACEMENT SUMMARY ===';
    RAISE NOTICE 'Total products: %', total_products;
    RAISE NOTICE 'Active products: %', active_products;
    RAISE NOTICE 'Categories: %', categories;
    RAISE NOTICE 'Average price: ₹%', avg_price;
    RAISE NOTICE 'Backup table: products_backup_before_dev_replace';
END $$;

-- =====================================================
-- SCRIPT COMPLETED
-- =====================================================
-- 
-- NEXT STEPS:
-- 1. Verify the data looks correct in your application
-- 2. Test product purchases and related functionality
-- 3. Update any cached product data if applicable
-- 4. Keep the backup table until you're confident everything works
-- 
-- TO RESTORE ORIGINAL DATA (if needed):
-- TRUNCATE TABLE products RESTART IDENTITY CASCADE;
-- INSERT INTO products SELECT * FROM products_backup_before_dev_replace;
-- =====================================================
