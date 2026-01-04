-- Improve notify_on_order_status_change messages to include order data and friendly copy
BEGIN;

CREATE OR REPLACE FUNCTION notify_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  ord_id_text TEXT;
  short_id TEXT;
  status_text TEXT;
  tracking TEXT;
  total_amount TEXT;
  title_text TEXT;
  body_text TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    status_text := upper(substring(NEW.status, 1, 1)) || lower(substring(NEW.status, 2));
    ord_id_text := NEW.id::text;
    short_id := right(ord_id_text, 6);
    tracking := COALESCE(NEW.tracking_number::text, '');
    total_amount := COALESCE(NEW.total::text, '');

    IF lower(NEW.status) = 'shipped' THEN
      title_text := format('Good news! Your order #%s has been marked as %s. 🚚', short_id, status_text);
      IF tracking <> '' THEN
        body_text := format('Good news! Order #%s is %s and on the way. Tracking: %s. View details: %s', short_id, status_text, tracking, concat('/#/orders/', ord_id_text));
      ELSE
        body_text := format('Good news! Order #%s has been marked %s and is on the way. View details: %s', short_id, status_text, concat('/#/orders/', ord_id_text));
      END IF;
    ELSIF lower(NEW.status) = 'processing' THEN
      title_text := format('Your order #%s is now Processing 🔄', short_id);
      body_text := format('We\'re preparing order #%s for shipment. We will notify you when it ships. View: %s', short_id, concat('/#/orders/', ord_id_text));
    ELSE
      -- Fallback generic message for other tracked statuses
      title_text := format('Order #%s status updated: %s', short_id, status_text);
      body_text := format('Update: Order #%s status is now %s. View: %s', short_id, status_text, concat('/#/orders/', ord_id_text));
    END IF;

    IF lower(NEW.status) IN ('processing', 'shipped') THEN
      INSERT INTO notifications (user_id, type, title, message, link, created_at)
      VALUES (
        NEW.user_id,
        'order_update',
        title_text,
        body_text,
        concat('/#/orders/', ord_id_text),
        NOW()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
