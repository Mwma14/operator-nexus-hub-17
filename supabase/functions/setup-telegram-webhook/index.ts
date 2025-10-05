import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const { action } = await req.json();
    
    if (action === 'set_webhook') {
      // Set the webhook URL
      const webhookUrl = 'https://xtmcrrwxthlzknufbbdw.supabase.co/functions/v1/handle-telegram-callback';
      
      const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['callback_query', 'message']
        })
      });

      const result = await response.json();
      console.log('Webhook setup result:', result);

      return new Response(JSON.stringify({ 
        success: true, 
        webhook_url: webhookUrl,
        telegram_response: result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get_webhook_info') {
      // Get current webhook info
      const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
      const result = await response.json();
      
      return new Response(JSON.stringify({ 
        success: true, 
        webhook_info: result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'delete_webhook') {
      // Delete webhook (useful for testing)
      const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`);
      const result = await response.json();
      
      return new Response(JSON.stringify({ 
        success: true, 
        telegram_response: result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use: set_webhook, get_webhook_info, or delete_webhook' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in setup-telegram-webhook:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});