import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessOrderRequest {
  orderId: string;
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

    const { orderId, action, adminNotes }: ProcessOrderRequest = await req.json();

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Order is not pending');
    }

    const newStatus = action === 'approve' ? 'completed' : 'rejected';
    let refundAmount = 0;

    // Start transaction-like operations
    if (action === 'reject' && order.credits_used > 0) {
      // Get current balance
      const { data: profile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('credits_balance')
        .eq('user_id', order.user_id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      const previousBalance = profile.credits_balance;
      const newBalance = previousBalance + order.credits_used;

      // Update user balance
      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update({ credits_balance: newBalance })
        .eq('user_id', order.user_id);

      if (updateError) {
        throw new Error('Failed to refund credits');
      }

      // Log transaction
      const { error: txError } = await supabaseClient
        .from('credit_transactions')
        .insert({
          user_id: order.user_id,
          transaction_type: 'refund',
          credit_amount: order.credits_used,
          previous_balance: previousBalance,
          new_balance: newBalance,
          status: 'completed',
          admin_notes: `Order rejected: ${adminNotes || 'No reason provided'}`,
          processed_at: new Date().toISOString()
        });

      if (txError) {
        console.error('Failed to log transaction:', txError);
      }

      refundAmount = order.credits_used;
    }

    // Update order status
    const { error: orderUpdateError } = await supabaseClient
      .from('orders')
      .update({ 
        status: newStatus,
        notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      throw new Error('Failed to update order');
    }

    // Log admin action
    const { error: auditError } = await supabaseClient
      .from('admin_audit_logs')
      .insert({
        admin_id: user.id,
        action_type: `order_${action}`,
        target_type: 'order',
        target_id: orderId,
        notes: adminNotes || `Order ${action}ed`
      });

    if (auditError) {
      console.error('Failed to log audit:', auditError);
    }

    // Send Telegram notification to user if they have a telegram_chat_id
    try {
      const { data: userProfile } = await supabaseClient
        .from('user_profiles')
        .select('telegram_chat_id, full_name')
        .eq('user_id', order.user_id)
        .single();

      if (userProfile?.telegram_chat_id) {
        const notificationMessage = action === 'approve'
          ? `✅ <b>Order Completed!</b>\n\n` +
            `Order ID: #${orderId.substring(0, 8)}\n` +
            `Status: Completed\n\n` +
            `Your order has been successfully processed and completed.`
          : `❌ <b>Order Rejected</b>\n\n` +
            `Order ID: #${orderId.substring(0, 8)}\n` +
            `Status: Rejected\n\n` +
            (refundAmount > 0 ? `💰 Refunded: ${refundAmount.toLocaleString()} credits\n\n` : '') +
            `Reason: ${adminNotes || 'No reason provided'}\n\n` +
            `Please contact support if you have questions.`;

        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-telegram-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: userProfile.telegram_chat_id,
            message: notificationMessage,
            parseMode: 'HTML'
          })
        });
      }
    } catch (notifError) {
      console.error('Failed to send Telegram notification:', notifError);
      // Don't fail the request if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: orderId,
          status: newStatus,
          refunded: refundAmount
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing order:', error);
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
