export type Json =
string |
number |
boolean |
null |
{[key: string]: Json | undefined;} |
Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          display_name: string;
          icon: string;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
        };
        Insert: {
          display_name: string;
          icon: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
        };
        Update: {
          display_name?: string;
          icon?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      payment_requests: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          credits_requested: number;
          id: number;
          payment_method: string;
          payment_proof_file_id: number | null;
          processed_at: string | null;
          status: string;
          total_cost_mmk: number;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          credits_requested: number;
          id?: number;
          payment_method: string;
          payment_proof_file_id?: number | null;
          processed_at?: string | null;
          status?: string;
          total_cost_mmk: number;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          credits_requested?: number;
          id?: number;
          payment_method?: string;
          payment_proof_file_id?: number | null;
          processed_at?: string | null;
          status?: string;
          total_cost_mmk?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }];

      };
      operators: {
        Row: {
          color_scheme: string;
          created_at: string;
          display_name: string;
          id: string;
          is_active: boolean;
          logo_url: string | null;
          name: string;
        };
        Insert: {
          color_scheme: string;
          created_at?: string;
          display_name: string;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name: string;
        };
        Update: {
          color_scheme?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          id: string;
          phone_number: string;
          price_credits: number;
          product_id: string;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          id?: string;
          phone_number: string;
          price_credits: number;
          product_id: string;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          id?: string;
          phone_number?: string;
          price_credits?: number;
          product_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_product_id_products_id_fk";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_users_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }];

      };
      products: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          operator_id: string;
          price_credits: number;
          price_mmk: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          operator_id: string;
          price_credits: number;
          price_mmk: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          operator_id?: string;
          price_credits?: number;
          price_mmk?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_categories_id_fk";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_operator_id_operators_id_fk";
            columns: ["operator_id"];
            isOneToOne: false;
            referencedRelation: "operators";
            referencedColumns: ["id"];
          }];

      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          credits_balance: number;
          full_name: string | null;
          id: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          credits_balance?: number;
          full_name?: string | null;
          id?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          credits_balance?: number;
          full_name?: string | null;
          id?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }];
      };
      products: {
        Row: {
          admin_notes: string | null;
          category: string;
          created_at: string;
          currency: string;
          description: string | null;
          id: number;
          is_active: boolean;
          logo: string | null;
          name: string;
          operator: string;
          price: number;
          stock_quantity: number;
          updated_at: string;
          validity_days: number;
        };
        Insert: {
          admin_notes?: string | null;
          category: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: number;
          is_active?: boolean;
          logo?: string | null;
          name: string;
          operator: string;
          price: number;
          stock_quantity?: number;
          updated_at?: string;
          validity_days?: number;
        };
        Update: {
          admin_notes?: string | null;
          category?: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: number;
          is_active?: boolean;
          logo?: string | null;
          name?: string;
          operator?: string;
          price?: number;
          stock_quantity?: number;
          updated_at?: string;
          validity_days?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          credits_used: number;
          currency: string;
          id: number;
          operator: string | null;
          phone_number: string | null;
          processed_at: string | null;
          product_id: number;
          quantity: number;
          status: string;
          total_price: number;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          credits_used?: number;
          currency?: string;
          id?: number;
          operator?: string | null;
          phone_number?: string | null;
          processed_at?: string | null;
          product_id: number;
          quantity?: number;
          status?: string;
          total_price: number;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          credits_used?: number;
          currency?: string;
          id?: number;
          operator?: string | null;
          phone_number?: string | null;
          processed_at?: string | null;
          product_id?: number;
          quantity?: number;
          status?: string;
          total_price?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }];
      };
      credit_transactions: {
        Row: {
          admin_notes: string | null;
          approval_notes: string | null;
          created_at: string;
          credit_amount: number;
          currency: string;
          id: number;
          mmk_amount: number | null;
          new_balance: number;
          payment_method: string | null;
          payment_reference: string | null;
          previous_balance: number;
          processed_at: string | null;
          status: string;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          approval_notes?: string | null;
          created_at?: string;
          credit_amount: number;
          currency?: string;
          id?: number;
          mmk_amount?: number | null;
          new_balance?: number;
          payment_method?: string | null;
          payment_reference?: string | null;
          previous_balance?: number;
          processed_at?: string | null;
          status?: string;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          approval_notes?: string | null;
          created_at?: string;
          credit_amount?: number;
          currency?: string;
          id?: number;
          mmk_amount?: number | null;
          new_balance?: number;
          payment_method?: string | null;
          payment_reference?: string | null;
          previous_balance?: number;
          processed_at?: string | null;
          status?: string;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }];
      };
    };
    Views: { [_ in
    never]: never };

    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      credit_request_status: "pending" | "approved" | "denied";
      order_status: "pending" | "approved" | "denied" | "completed";
      payment_method: "kpay" | "wavepay";
      user_role: "user" | "admin";
    };
    CompositeTypes: { [_ in
    never]: never };

  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) |
  {schema: keyof DatabaseWithoutInternals;},
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ?
  keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
  DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) :
  never) = never> =
DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ?
(DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
  Row: infer R;
} ?
R :
never :
DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
DefaultSchema["Views"]) ?
(DefaultSchema["Tables"] &
DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
  Row: infer R;
} ?
R :
never :
never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  keyof DefaultSchema["Tables"] |
  {schema: keyof DatabaseWithoutInternals;},
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ?
  keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] :
  never) = never> =
DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ?
DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Insert: infer I;
} ?
I :
never :
DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ?
DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Insert: infer I;
} ?
I :
never :
never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  keyof DefaultSchema["Tables"] |
  {schema: keyof DatabaseWithoutInternals;},
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ?
  keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] :
  never) = never> =
DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ?
DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Update: infer U;
} ?
U :
never :
DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ?
DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Update: infer U;
} ?
U :
never :
never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  keyof DefaultSchema["Enums"] |
  {schema: keyof DatabaseWithoutInternals;},
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ?
  keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] :
  never) = never> =
DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ?
DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] :
DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ?
DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] :
never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  keyof DefaultSchema["CompositeTypes"] |
  {schema: keyof DatabaseWithoutInternals;},
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ?
  keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] :
  never) = never> =
PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ?
DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] :
PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ?
DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] :
never;

export const Constants = {
  public: {
    Enums: {
      credit_request_status: ["pending", "approved", "denied"],
      order_status: ["pending", "approved", "denied", "completed"],
      payment_method: ["kpay", "wavepay"],
      user_role: ["user", "admin"]
    }
  }
} as const;