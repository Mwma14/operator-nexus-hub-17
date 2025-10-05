-- Fix search path security issue for get_service_role_key function
CREATE OR REPLACE FUNCTION public.get_service_role_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return the service role key directly
  -- This function is SECURITY DEFINER so it bypasses RLS
  RETURN 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bWNycnd4dGhsemtudWZiYmR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ3ODQ3NywiZXhwIjoyMDc0MDU0NDc3fQ.FbgKoGiPdpC02FvQfYSjIxBv7pO0wV9-bA-v6YjIlK4';
END;
$$;