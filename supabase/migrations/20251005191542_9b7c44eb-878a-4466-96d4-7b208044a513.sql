-- Enable pg_net extension so DB can call Edge Functions via HTTP
create extension if not exists pg_net with schema extensions;

-- Ensure notification triggers exist (no-op if they already do)
-- Orders trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'on_order_created' AND c.relname = 'orders'
  ) THEN
    CREATE TRIGGER on_order_created
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_order();
  END IF;
END $$;

-- Payment requests trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'on_payment_request_created' AND c.relname = 'payment_requests'
  ) THEN
    CREATE TRIGGER on_payment_request_created
    AFTER INSERT ON public.payment_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_payment();
  END IF;
END $$;