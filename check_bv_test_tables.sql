-- Check which BV test tables exist
-- Run this query first to see what's missing

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users_bvTest', 'products_bvTest', 'purchases_bvTest', 'walletBalances_bvTest', 'transactions_bvTest') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_name LIKE '%_bvTest'
ORDER BY table_name;

-- Also check if the original tables exist (for reference)
SELECT 
    table_name,
    'Production Table' as type
FROM information_schema.tables 
WHERE table_name IN ('users', 'products', 'purchases', 'wallet_balances', 'transactions')
ORDER BY table_name;
