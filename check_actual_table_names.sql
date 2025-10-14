-- Check actual table names in the database
-- This will show you the exact table names that exist

-- Check for any tables with 'bvtest' in the name
SELECT 
    table_name,
    'BV Test Table' as type
FROM information_schema.tables 
WHERE table_name LIKE '%bvtest%'
ORDER BY table_name;

-- Check for any tables with 'bv' in the name
SELECT 
    table_name,
    'BV Related Table' as type
FROM information_schema.tables 
WHERE table_name LIKE '%bv%'
ORDER BY table_name;

-- Check all tables to see what exists
SELECT 
    table_name,
    'All Tables' as type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
