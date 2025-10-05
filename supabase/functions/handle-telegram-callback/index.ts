import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  try {
    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: true,
      }),
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

async function editMessageText(chatId: string, messageId: number, text: string) {
  try {
    await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Error editing message:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

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

    const update = await req.json();
    console.log('Telegram update received:', JSON.stringify(update));

    // Handle callback queries from inline buttons
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      console.log('Processing callback:', callbackData);

      // Parse callback data: format is "action_type:id"
      const [action, id] = callbackData.split(':');
      
      if (action === 'approve_payment' || action === 'reject_payment') {
        const actionType = action === 'approve_payment' ? 'approve' : 'reject';
        
        // Call the process-payment-request edge function
        const { data, error } = await supabaseClient.functions.invoke('process-payment-request', {
          body: {
            requestId: id,
            action: actionType,
            adminNotes: `Processed via Telegram by admin`
          }
        });

        if (error) {
          console.error('Error processing payment:', error);
          await answerCallbackQuery(callbackQuery.id, `❌ Error: ${error.message}`);
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update the message to show it's been processed
        const statusEmoji = actionType === 'approve' ? '✅' : '❌';
        const statusText = actionType === 'approve' ? 'APPROVED' : 'REJECTED';
        const updatedMessage = `${callbackQuery.message.text}\n\n${statusEmoji} <b>${statusText}</b> via Telegram`;
        
        await editMessageText(chatId, messageId, updatedMessage);
        await answerCallbackQuery(callbackQuery.id, `${statusEmoji} Payment request ${statusText.toLowerCase()} successfully!`);

      } else if (action === 'approve_order' || action === 'reject_order') {
        const actionType = action === 'approve_order' ? 'approve' : 'reject';
        
        // Call the process-order edge function
        const { data, error } = await supabaseClient.functions.invoke('process-order', {
          body: {
            orderId: id,
            action: actionType,
            adminNotes: `Processed via Telegram by admin`
          }
        });

        if (error) {
          console.error('Error processing order:', error);
          await answerCallbackQuery(callbackQuery.id, `❌ Error: ${error.message}`);
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update the message to show it's been processed
        const statusEmoji = actionType === 'approve' ? '✅' : '❌';
        const statusText = actionType === 'approve' ? 'APPROVED' : 'REJECTED';
        const updatedMessage = `${callbackQuery.message.text}\n\n${statusEmoji} <b>${statusText}</b> via Telegram`;
        
        await editMessageText(chatId, messageId, updatedMessage);
        await answerCallbackQuery(callbackQuery.id, `${statusEmoji} Order ${statusText.toLowerCase()} successfully!`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in handle-telegram-callback:', error);
    return new Response(
      JSON.stringify({ 
        ok: true,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 to Telegram to avoid retries
      }
    );
  }
});
