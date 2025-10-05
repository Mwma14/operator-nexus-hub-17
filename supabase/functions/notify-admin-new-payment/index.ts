import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId: string, message: string, inlineKeyboard?: any) {
  try {
    const body: any = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    if (inlineKeyboard) {
      body.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API error:', data);
      throw new Error(data.description || 'Failed to send Telegram message');
    }

    return data;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
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

    const { record } = await req.json();
    console.log('New payment request received:', record);

    // Get admin chat ID from site settings
    const { data: settings } = await supabaseClient
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'telegram_settings')
      .single();

    const telegramSettings = settings?.setting_value as any;
    const adminChatId = telegramSettings?.admin_chat_id;

    if (!adminChatId) {
      console.log('No admin chat ID configured, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Get user details
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('full_name, email')
      .eq('user_id', record.user_id)
      .single();

    const message = `💳 <b>New Payment Request!</b>\n\n` +
      `🆔 Request ID: #${record.id.substring(0, 8)}\n` +
      `👤 Customer: ${userProfile?.full_name || 'Unknown'}\n` +
      `📧 Email: ${userProfile?.email || 'N/A'}\n\n` +
      `💎 Credits Requested: ${record.credits_requested.toLocaleString()}\n` +
      `💰 Amount: ${record.total_cost_mmk.toLocaleString()} MMK\n` +
      `💳 Payment Method: ${record.payment_method}\n` +
      `📸 Proof: ${record.payment_proof_url ? 'Uploaded' : 'Not uploaded'}\n\n` +
      `⏰ Time: ${new Date(record.created_at).toLocaleString()}`;

    // Add inline keyboard buttons for approve/reject
    const inlineKeyboard = [
      [
        { text: '✅ Approve', callback_data: `approve_payment:${record.id}` },
        { text: '❌ Reject', callback_data: `reject_payment:${record.id}` }
      ]
    ];

    await sendTelegramMessage(adminChatId, message, inlineKeyboard);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in notify-admin-new-payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 // Return 200 to avoid trigger retry
      }
    );
  }
});
