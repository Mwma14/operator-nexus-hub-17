-- Add telegram_chat_id to user_profiles for Telegram notifications
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;