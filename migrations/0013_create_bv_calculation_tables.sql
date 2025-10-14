-- Create BV calculation tables for testing
-- These tables use _bvtest suffix and reference _bvtest tables

-- First, ensure users_bvtest has unique constraint on user_id
ALTER TABLE users_bvtest ADD CONSTRAINT uk_users_bvtest_user_id UNIQUE (user_id);

-- 1. Lifetime BV Calculations Table
CREATE TABLE lifetime_bv_calculations_bvtest (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL, -- FK to users_bvtest.user_id (display ID)
    parent_id VARCHAR, -- Parent's user_id
    user_level INTEGER DEFAULT 0, -- Tree depth level
    left_bv DECIMAL(12,2) DEFAULT 0.00, -- Left leg BV
    right_bv DECIMAL(12,2) DEFAULT 0.00, -- Right leg BV
    self_bv DECIMAL(12,2) DEFAULT 0.00, -- lifetime purchase BV of own
    directs_bv DECIMAL(12,2) DEFAULT 0.00, -- lifetime purchase BV of level 1 direct child
    matching_bv DECIMAL(12,2) DEFAULT 0.00, -- Previous matched BV (min of left/right bv)
    new_match DECIMAL(12,2) DEFAULT 0.00, -- New match amount (current matching_bv - previous matching_bv)
    team_bv DECIMAL(12,2) DEFAULT 0.00, -- lifetime Total team BV
    carry_forward_left DECIMAL(12,2) DEFAULT 0.00, -- Left carry forward
    carry_forward_right DECIMAL(12,2) DEFAULT 0.00, -- Right carry forward
    rank VARCHAR DEFAULT 'Executive', -- rank is based on team bv
    diff_income DECIMAL(12,2) DEFAULT 0.00, -- calculation based on ranking and new match
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_bv_calculations_user_bvtest FOREIGN KEY (user_id) REFERENCES users_bvtest(user_id) ON DELETE CASCADE
);

-- 2. Monthly BV Table
CREATE TABLE monthly_bv_bvtest (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL, -- FK to users_bvtest.user_id (display ID)
    parent_id VARCHAR, -- Parent's user_id
    month_id INTEGER NOT NULL, -- month 1, 2, 3, ... n
    month_startdate DATE NOT NULL,
    month_enddate DATE NOT NULL,
    month_bv_left DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- left bv for this month
    month_bv_right DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- right bv for this month
    month_bv_directs DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- directs_bv of that month
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_monthly_bv_user_bvtest FOREIGN KEY (user_id) REFERENCES users_bvtest(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, month_id) -- One record per user per month
);

-- 3. BV Transactions Table (for audit trail)
CREATE TABLE bv_transactions_bvtest (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL, -- FK to users_bvtest.user_id (display ID)
    parent_id VARCHAR, -- Parent's user_id
    purchase_id VARCHAR, -- FK to purchases_bvtest.id
    transaction_type VARCHAR NOT NULL, -- 'bv_addition', 'bv_calculation', 'income_calculation'
    prev_left_bv DECIMAL(12,2) DEFAULT 0.00,
    new_left_bv DECIMAL(12,2) DEFAULT 0.00,
    prev_right_bv DECIMAL(12,2) DEFAULT 0.00,
    new_right_bv DECIMAL(12,2) DEFAULT 0.00,
    prev_matching_bv DECIMAL(12,2) DEFAULT 0.00,
    new_matching_bv DECIMAL(12,2) DEFAULT 0.00,
    new_match_amount DECIMAL(12,2) DEFAULT 0.00,
    carry_forward_left DECIMAL(12,2) DEFAULT 0.00,
    carry_forward_right DECIMAL(12,2) DEFAULT 0.00,
    rank VARCHAR DEFAULT 'Executive',
    rank_percentage DECIMAL(5,4) DEFAULT 0.0000, -- e.g., 0.1800 for 18%
    diff_income DECIMAL(12,2) DEFAULT 0.00,
    direct_income DECIMAL(12,2) DEFAULT 0.00,
    month_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_bv_transactions_user_bvtest FOREIGN KEY (user_id) REFERENCES users_bvtest(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bv_transactions_purchase_bvtest FOREIGN KEY (purchase_id) REFERENCES purchases_bvtest(id) ON DELETE SET NULL
);

-- 4. Rank Configurations Table (shared between test and production)
CREATE TABLE rank_configurations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    rank_name VARCHAR UNIQUE NOT NULL,
    percentage DECIMAL(5,4) NOT NULL, -- e.g., 0.1800 for 18%
    min_team_bv DECIMAL(12,2) DEFAULT 0.00, -- Minimum team BV required
    min_directs INTEGER DEFAULT 0, -- Minimum direct referrals required
    bonus_amount DECIMAL(12,2) DEFAULT 0.00, -- Fixed bonus amount
    tour_rewards TEXT, -- JSON or text description of tour rewards
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default rank configurations
INSERT INTO rank_configurations (rank_name, percentage, min_team_bv, min_directs) VALUES
('Executive', 0.0500, 0.00, 0),
('Bronze Star', 0.0800, 10000.00, 2),
('Gold Star', 0.1000, 25000.00, 3),
('Emerald Star', 0.1200, 50000.00, 4),
('Ruby Star', 0.1500, 100000.00, 5),
('Diamond', 0.1800, 200000.00, 6),
('Wise President', 0.2000, 500000.00, 8),
('President', 0.2200, 1000000.00, 10),
('Ambassador', 0.2500, 2000000.00, 12),
('Deputy Director', 0.2800, 5000000.00, 15),
('Director', 0.3000, 10000000.00, 20),
('Founder', 0.3500, 20000000.00, 25);

-- Create indexes for better performance
CREATE INDEX idx_lifetime_bv_calculations_bvtest_user_id ON lifetime_bv_calculations_bvtest(user_id);
CREATE INDEX idx_lifetime_bv_calculations_bvtest_parent_id ON lifetime_bv_calculations_bvtest(parent_id);
CREATE INDEX idx_monthly_bv_bvtest_user_id ON monthly_bv_bvtest(user_id);
CREATE INDEX idx_monthly_bv_bvtest_month_id ON monthly_bv_bvtest(month_id);
CREATE INDEX idx_bv_transactions_bvtest_user_id ON bv_transactions_bvtest(user_id);
CREATE INDEX idx_bv_transactions_bvtest_purchase_id ON bv_transactions_bvtest(purchase_id);
CREATE INDEX idx_bv_transactions_bvtest_month_id ON bv_transactions_bvtest(month_id);
CREATE INDEX idx_rank_configurations_rank_name ON rank_configurations(rank_name);
