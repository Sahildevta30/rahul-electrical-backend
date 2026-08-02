-- Add shipping_state to orders, auto-filled at checkout from the pincode lookup.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
