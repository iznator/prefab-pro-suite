-- Add pin and edit support to messages
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL;

-- Create channel reads table for unread tracking
CREATE TABLE IF NOT EXISTS public.chat_channel_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.chat_channel_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own read status
CREATE POLICY "Users can view own reads"
  ON public.chat_channel_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can upsert their own read status
CREATE POLICY "Users can insert own reads"
  ON public.chat_channel_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reads"
  ON public.chat_channel_reads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow channel admins to pin messages
CREATE POLICY "Channel admins can pin messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR is_channel_admin(channel_id, auth.uid())
  );

-- Drop the old update policy that only allowed own messages
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.chat_messages;

-- Recreate: users can edit content of own messages, admins can pin any
CREATE POLICY "Users can edit their own messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_channel_admin(channel_id, auth.uid()));