-- Create a secure function to get service role key
-- This avoids needing to use ALTER DATABASE which requires superuser privileges

CREATE OR REPLACE FUNCTION public.get_service_role_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the service role key directly
  -- This function is SECURITY DEFINER so it bypasses RLS
  RETURN 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bWNycnd4dGhsemtudWZiYmR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ3ODQ3NywiZXhwIjoyMDc0MDU0NDc3fQ.FbgKoGiPdpC02FvQfYSjIxBv7pO0wV9-bA-v6YjIlK4';
END;
$$;

-- Update the notify_admin_new_order function to use get_service_role_key()
CREATE OR REPLACE FUNCTION notify_admin_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://xtmcrrwxthlzknufbbdw.supabase.co/functions/v1/notify-admin-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_service_role_key()
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send order notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update the notify_admin_new_payment function to use get_service_role_key()
CREATE OR REPLACE FUNCTION notify_admin_new_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://xtmcrrwxthlzknufbbdw.supabase.co/functions/v1/notify-admin-new-payment',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_service_role_key()
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send payment notification: %', SQLERRM;
    RETURN NEW;
END;
$$;