-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_type text NOT NULL,
  mmk_amount numeric,
  credit_amount integer NOT NULL,
  currency text DEFAULT 'MMK',
  status text DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  previous_balance integer DEFAULT 0,
  new_balance integer DEFAULT 0,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  admin_notes text,
  approval_notes text
);

-- Create approval_workflows table
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type text NOT NULL,
  target_id integer,
  status text DEFAULT 'pending',
  admin_id uuid,
  admin_notes text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Add missing columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS credits_used integer,
ADD COLUMN IF NOT EXISTS total_price numeric,
ADD COLUMN IF NOT EXISTS operator text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'MMK';

-- Enable RLS on new tables
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_transactions
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create transactions"
ON public.credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for approval_workflows
CREATE POLICY "Admins can view all workflows"
ON public.approval_workflows
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage workflows"
ON public.approval_workflows
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_credit_transactions_updated_at
BEFORE UPDATE ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
BEFORE UPDATE ON public.approval_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();