-- Migration: Add receipt data storage fields to fund_requests table
-- This allows storing receipt images/PDFs as Base64 data directly in the database

ALTER TABLE fund_requests ADD COLUMN IF NOT EXISTS receipt_data TEXT;
ALTER TABLE fund_requests ADD COLUMN IF NOT EXISTS receipt_content_type VARCHAR(100);
ALTER TABLE fund_requests ADD COLUMN IF NOT EXISTS receipt_filename VARCHAR(255);
ALTER TABLE fund_requests ADD COLUMN IF NOT EXISTS receipt_size INTEGER;

COMMENT ON COLUMN fund_requests.receipt_data IS 'Base64 encoded receipt image/PDF data';
COMMENT ON COLUMN fund_requests.receipt_content_type IS 'MIME type of the receipt file (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN fund_requests.receipt_filename IS 'Original filename of the uploaded receipt';
COMMENT ON COLUMN fund_requests.receipt_size IS 'Size of the receipt file in bytes';



