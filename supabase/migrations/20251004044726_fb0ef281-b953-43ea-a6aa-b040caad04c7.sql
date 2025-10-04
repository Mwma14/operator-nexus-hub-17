-- Fix Telegram notification triggers by recreating them properly

-- First, drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
DROP TRIGGER IF EXISTS on_payment_request_created ON public.payment_requests;

-- Drop and recreate the notification functions to use direct edge function calls
DROP FUNCTION IF EXISTS notify_admin_new_order();
DROP FUNCTION IF EXISTS notify_admin_new_payment();

-- Create function to notify admin of new orders
CREATE OR REPLACE FUNCTION notify_admin_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Call the edge function asynchronously using pg_net
  -- Using the full URL with project reference
  SELECT net.http_post(
    url := 'https://xtmcrrwxthlzknufbbdw.supabase.co/functions/v1/notify-admin-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send order notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create function to notify admin of new payment requests
CREATE OR REPLACE FUNCTION notify_admin_new_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Call the edge function asynchronously using pg_net
  -- Using the full URL with project reference
  SELECT net.http_post(
    url := 'https://xtmcrrwxthlzknufbbdw.supabase.co/functions/v1/notify-admin-new-payment',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send payment notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new orders
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_order();

-- Create trigger for new payment requests
CREATE TRIGGER on_payment_request_created
  AFTER INSERT ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_payment();