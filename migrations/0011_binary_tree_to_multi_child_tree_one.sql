-- Migration script to update existing users to multi-child MLM system
-- This will:
-- 1. Set parent_id = sponsor_id (as per new logic)
-- 2. Calculate order based on creation time for users under same parent
-- 3. Keep existing position (left/right) but update order

-- Step 1: Update parent_id to match sponsor_id for all users
UPDATE users 
SET parent_id = sponsor_id 
WHERE sponsor_id IS NOT NULL 
  AND sponsor_id != 'admin-demo'  -- Skip admin-demo as it's the root
  AND parent_id != sponsor_id;    -- Only update if different

-- Step 2: Calculate and update order for users under each parent
-- This uses ROW_NUMBER() to assign sequential order based on creation time
WITH ordered_users AS (
  SELECT 
    id,
    parent_id,
    position,
    ROW_NUMBER() OVER (
      PARTITION BY parent_id, position 
      ORDER BY created_at ASC
    ) - 1 AS new_order  -- Start from 0
  FROM users 
  WHERE parent_id IS NOT NULL 
    AND parent_id != 'admin-demo'
    AND position IS NOT NULL
)
UPDATE users 
SET "order" = ordered_users.new_order
FROM ordered_users
WHERE users.id = ordered_users.id;

-- Step 3: Verify the migration results
SELECT 
  parent_id,
  position,
  "order",
  COUNT(*) as user_count,
  STRING_AGG(user_id, ', ' ORDER BY "order") as user_ids
FROM users 
WHERE parent_id IS NOT NULL 
  AND parent_id != 'admin-demo'
  AND position IS NOT NULL
GROUP BY parent_id, position, "order"
ORDER BY parent_id, position, "order";

-- Step 4: Show final structure
SELECT 
  user_id,
  first_name,
  last_name,
  sponsor_id,
  parent_id,
  position,
  "order",
  created_at
FROM users 
WHERE parent_id IS NOT NULL 
  AND parent_id != 'admin-demo'
ORDER BY parent_id, position, "order", created_at;


Select * from users
where id = '78e7d154-6bb5-4696-9765-a5c1af43dd5b';


SELECT * FROM users_backup_binary_tree;

SELECT * FROM pending_recruits_backup_20251003_051958;
SELECT * FROM pending_recruits;

SELECT * FROM recruitment_requests_backup_20251003_051958;
SELECT * FROM recruitment_requests;

INSERT INTO pending_recruits 
SELECT * FROM pending_recruits_backup_20251003_051958;

-- Step 2: Truncate the users table
--TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Step 3: Restore data from your backup table
INSERT INTO users 
SELECT * FROM users_backup_binary_tree;

-- Step 4: Verify the restore was successful
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN "order" IS NOT NULL THEN 1 END) as users_with_order,
  COUNT(CASE WHEN position IS NOT NULL THEN 1 END) as users_with_position
FROM users;

SELECT 
id, user_id, email, first_name, sponsor_id, parent_id, left_child_id, right_child_id, level, "order"
FROM users;


SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';