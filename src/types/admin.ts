// Central type definitions matching Supabase database schema

export interface PaymentRequest {
  id: string;
  user_id: string;
  credits_requested: number;
  total_cost_mmk: number;
  payment_method: string;
  payment_proof_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
  total_price: number | null;
  credits_used: number | null;
  currency: string;
  operator: string | null;
  phone_number: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  operator: string | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  credits_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  mmk_amount: number | null;
  credit_amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  previous_balance: number;
  new_balance: number;
  processed_at: string | null;
  created_at: string;
  admin_notes: string | null;
  approval_notes: string | null;
}
