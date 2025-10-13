SELECT 
id, user_id, email, first_name, sponsor_id, parent_id, position, left_child_id, right_child_id, level, "order"
FROM users;


WITH ordered AS (
  SELECT
    id,
    sponsor_id,
    ROW_NUMBER() OVER (
      PARTITION BY sponsor_id
      ORDER BY
        activation_date NULLS LAST,
        first_name      NULLS LAST,
        id
    ) AS rn
  FROM users
  WHERE sponsor_id IS NOT NULL
),
assign AS (
  SELECT
    id,
    sponsor_id,
    CASE WHEN rn % 2 = 1 THEN 'left' ELSE 'right' END AS new_position,
    CASE WHEN rn % 2 = 1 THEN (rn - 1)/2 ELSE (rn - 2)/2 END AS new_order
  FROM ordered
)
SELECT
  u.id,
  u.first_name,
  a.sponsor_id      AS will_be_parent_id,
  a.new_position    AS will_be_position,
  a.new_order       AS will_be_order
FROM assign a
JOIN users u ON u.id = a.id
ORDER BY will_be_parent_id, will_be_position, will_be_order, u.id;


--------------


WITH const AS (
  SELECT
    'admin-demo'::text                                       AS admin_id,
    '78e7d154-6bb5-4696-9765-a5c1af43dd5b'::text             AS sam1_id,
    'cea7e82e-8190-45a1-9bcc-8f87c8a750fa'::text             AS cea7_id
),
remap AS (
  SELECT
    u.id,
    u.first_name,
    u.sponsor_id,
    u.activation_date,
    CASE
      WHEN u.sponsor_id = c.admin_id AND u.id NOT IN (c.sam1_id, c.cea7_id)
        THEN c.sam1_id
      ELSE u.sponsor_id
    END AS effective_parent_id
  FROM users u
  CROSS JOIN const c
  WHERE u.sponsor_id IS NOT NULL
),
ordered AS (
  SELECT
    id,
    first_name,
    effective_parent_id,
    ROW_NUMBER() OVER (
      PARTITION BY effective_parent_id
      ORDER BY activation_date NULLS LAST, first_name NULLS LAST, id
    ) AS rn
  FROM remap
),
assign AS (
  SELECT
    id,
    effective_parent_id,
    rn,
    CASE WHEN rn % 2 = 1 THEN 'left' ELSE 'right' END AS calc_position,
    CASE WHEN rn % 2 = 1 THEN (rn - 1)/2 ELSE (rn - 2)/2 END AS calc_order
  FROM ordered
),
final_target AS (
  SELECT
    a.id,
    a.rn,
    u.first_name,
    CASE
      WHEN a.id = c.sam1_id THEN c.admin_id
      WHEN a.id = c.cea7_id THEN c.admin_id
      ELSE a.effective_parent_id
    END AS target_parent_id,
    CASE
      WHEN a.id = c.sam1_id THEN 'left'
      WHEN a.id = c.cea7_id THEN 'right'
      ELSE a.calc_position
    END AS target_position,
    CASE
      WHEN a.id = c.sam1_id THEN 0
      WHEN a.id = c.cea7_id THEN 0
      ELSE a.calc_order
    END AS target_order
  FROM assign a
  JOIN users u ON u.id = a.id
  CROSS JOIN const c
)
SELECT *
FROM final_target
ORDER BY target_parent_id, target_position, target_order, id


-----------


-- WITH const AS (
--   SELECT
--     'admin-demo'::text                                       AS admin_id,
--     '78e7d154-6bb5-4696-9765-a5c1af43dd5b'::text             AS sam1_id,
--     'cea7e82e-8190-45a1-9bcc-8f87c8a750fa'::text             AS cea7_id
-- ),
-- remap AS (
--   SELECT
--     u.id,
--     u.first_name,
--     u.sponsor_id,
--     u.activation_date,
--     CASE
--       WHEN u.sponsor_id = c.admin_id AND u.id NOT IN (c.sam1_id, c.cea7_id)
--         THEN c.sam1_id
--       ELSE u.sponsor_id
--     END AS effective_parent_id
--   FROM users u
--   CROSS JOIN const c
--   WHERE u.sponsor_id IS NOT NULL
-- ),
-- ordered AS (
--   SELECT
--     id,
--     effective_parent_id,
--     ROW_NUMBER() OVER (
--       PARTITION BY effective_parent_id
--       ORDER BY activation_date NULLS LAST, first_name NULLS LAST, id
--     ) AS rn
--   FROM remap
-- ),
-- assign AS (
--   SELECT
--     id,
--     effective_parent_id,
--     CASE WHEN rn % 2 = 1 THEN 'left' ELSE 'right' END AS calc_position,
--     CASE WHEN rn % 2 = 1 THEN (rn - 1)/2 ELSE (rn - 2)/2 END AS calc_order
--   FROM ordered
-- ),
-- final_target AS (
--   SELECT
--     a.id,
--     -- Force admin-demo to have exactly these two children:
--     CASE
--       WHEN a.id = c.sam1_id THEN c.admin_id
--       WHEN a.id = c.cea7_id THEN c.admin_id
--       ELSE a.effective_parent_id
--     END AS target_parent_id,
--     CASE
--       WHEN a.id = c.sam1_id THEN 'left'
--       WHEN a.id = c.cea7_id THEN 'right'
--       ELSE a.calc_position
--     END AS target_position,
--     CASE
--       WHEN a.id = c.sam1_id THEN 0
--       WHEN a.id = c.cea7_id THEN 0
--       ELSE a.calc_order
--     END AS target_order
--   FROM assign a
--   CROSS JOIN const c
-- )
-- UPDATE users u
-- SET
--   parent_id = f.target_parent_id,
--   position  = f.target_position,
--   "order"   = f.target_order
-- FROM final_target f
-- CROSS JOIN const c
-- WHERE u.id = f.id
--   AND u.id <> c.admin_id       -- don't update the admin node itself
--   AND u.id <> u.parent_id;     -- avoid self-parenting if any exist


  -----------

  SELECT parent_id,
       SUM(CASE WHEN position='left'  THEN 1 ELSE 0 END) AS left_count,
       SUM(CASE WHEN position='right' THEN 1 ELSE 0 END) AS right_count,
       COUNT(*) AS total_children
FROM users
WHERE parent_id IS NOT NULL
GROUP BY parent_id
ORDER BY total_children DESC, parent_id;