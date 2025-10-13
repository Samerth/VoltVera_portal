-- Create fund_requests table for pending fund requests
CREATE TABLE fund_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  amount decimal(10, 2) NOT NULL,
  receipt_url varchar,
  status varchar DEFAULT 'pending',
  payment_method varchar,
  transaction_id varchar,
  admin_notes text,
  processed_by varchar,
  processed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Add comments to document the table purpose
COMMENT ON TABLE fund_requests IS 'Table for storing pending fund requests from users';
COMMENT ON COLUMN fund_requests.user_id IS 'User ID who submitted the fund request';
COMMENT ON COLUMN fund_requests.amount IS 'Amount requested in INR';
COMMENT ON COLUMN fund_requests.receipt_url IS 'URL to uploaded receipt image/PDF';
COMMENT ON COLUMN fund_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON COLUMN fund_requests.payment_method IS 'Payment method used: bank_transfer, upi, cash, cheque, etc.';
COMMENT ON COLUMN fund_requests.transaction_id IS 'Transaction ID for tracking';
COMMENT ON COLUMN fund_requests.admin_notes IS 'Admin notes and comments';
COMMENT ON COLUMN fund_requests.processed_by IS 'Admin who processed the request';
COMMENT ON COLUMN fund_requests.processed_at IS 'When the request was processed';
