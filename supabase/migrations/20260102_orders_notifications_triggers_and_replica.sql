-- Create trigger function to insert notifications when order status transitions to processing/shipped
BEGIN;

-- Function to insert notification on status change
CREATE OR REPLACE FUNCTION notify_on_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when status actually changes
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Normalize status to lowercase for consistent checks
    IF lower(NEW.status) IN ('processing', 'shipped') THEN
      INSERT INTO notifications (user_id, type, title, message, link, created_at)
      VALUES (
        NEW.user_id,
        'order_update',
        concat('Order ', NEW.id::text, ' is now ', NEW.status),
        concat('Your order ', NEW.id::text, ' status has been updated to: ', NEW.status),
        concat('/#/orders/', NEW.id::text),
        NOW()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS trg_notify_order_status_change ON orders;
CREATE TRIGGER trg_notify_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_on_order_status_change();

-- Set REPLICA IDENTITY to FULL so realtime replication includes full row visibility
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Create publication for realtime if not exists (some Supabase setups manage publications for you)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'orders_notifications_pub') THEN
    CREATE PUBLICATION orders_notifications_pub FOR TABLE orders, notifications;
  END IF;
END$$;

COMMIT;
