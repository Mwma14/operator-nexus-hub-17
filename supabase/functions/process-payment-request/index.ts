import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessPaymentRequest {
  requestId: string;
  action: 'approve' | 'reject';
  adminNotes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: hasRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error('Admin privileges required');
    }

    const { requestId, action, adminNotes }: ProcessPaymentRequest = await req.json();

    // Fetch payment request
    const { data: request, error: requestError } = await supabaseClient
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Payment request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Payment request is not pending');
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    let newBalance = 0;

    if (action === 'approve') {
      // Get current balance
      const { data: profile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('credits_balance')
        .eq('user_id', request.user_id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      const previousBalance = profile.credits_balance;
      newBalance = previousBalance + request.credits_requested;

      // Update user balance
      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update({ credits_balance: newBalance })
        .eq('user_id', request.user_id);

      if (updateError) {
        throw new Error('Failed to add credits');
      }

      // Log transaction
      const { error: txError } = await supabaseClient
        .from('credit_transactions')
        .insert({
          user_id: request.user_id,
          transaction_type: 'purchase',
          credit_amount: request.credits_requested,
          mmk_amount: request.total_cost_mmk,
          previous_balance: previousBalance,
          new_balance: newBalance,
          payment_method: request.payment_method,
          status: 'completed',
          admin_notes: adminNotes || 'Payment approved',
          processed_at: new Date().toISOString()
        });

      if (txError) {
        console.error('Failed to log transaction:', txError);
      }
    }

    // Update payment request
    const { error: requestUpdateError } = await supabaseClient
      .from('payment_requests')
      .update({ 
        status: newStatus,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (requestUpdateError) {
      throw new Error('Failed to update payment request');
    }

    // Log admin action
    const { error: auditError } = await supabaseClient
      .from('admin_audit_logs')
      .insert({
        admin_id: user.id,
        action_type: `payment_${action}`,
        target_type: 'payment_request',
        target_id: requestId,
        notes: adminNotes || `Payment request ${action}ed`
      });

    if (auditError) {
      console.error('Failed to log audit:', auditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        request: {
          id: requestId,
          status: newStatus,
          creditsAdded: action === 'approve' ? request.credits_requested : 0,
          newBalance
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing payment request:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
