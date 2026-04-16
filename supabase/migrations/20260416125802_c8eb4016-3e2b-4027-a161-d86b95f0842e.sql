
-- Chat channels
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'channel' CHECK (type IN ('channel', 'dm')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Channel members
CREATE TABLE public.chat_channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'link')),
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Message reactions
CREATE TABLE public.chat_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Mentions
CREATE TABLE public.chat_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_mentions ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages and reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;

-- Indexes
CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at);
CREATE INDEX idx_chat_channel_members_user ON public.chat_channel_members(user_id);
CREATE INDEX idx_chat_channel_members_channel ON public.chat_channel_members(channel_id);
CREATE INDEX idx_chat_message_reactions_message ON public.chat_message_reactions(message_id);
CREATE INDEX idx_chat_mentions_user ON public.chat_mentions(user_id);

-- Updated_at triggers
CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: chat_channels
CREATE POLICY "Members can view their channels"
  ON public.chat_channels FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channel_members
      WHERE channel_id = chat_channels.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create channels"
  ON public.chat_channels FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Channel admins can update channels"
  ON public.chat_channels FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channel_members
      WHERE channel_id = chat_channels.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Channel admins can delete channels"
  ON public.chat_channels FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channel_members
      WHERE channel_id = chat_channels.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS: chat_channel_members
CREATE POLICY "Members can view channel members"
  ON public.chat_channel_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channel_members AS ccm
      WHERE ccm.channel_id = chat_channel_members.channel_id AND ccm.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel admins can add members"
  ON public.chat_channel_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_channel_members AS ccm
      WHERE ccm.channel_id = chat_channel_members.channel_id AND ccm.user_id = auth.uid() AND ccm.role = 'admin'
    )
    OR
    -- Allow creator to add themselves as first member
    (user_id = auth.uid())
  );

CREATE POLICY "Channel admins can remove members"
  ON public.chat_channel_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.chat_channel_members AS ccm
      WHERE ccm.channel_id = chat_channel_members.channel_id AND ccm.user_id = auth.uid() AND ccm.role = 'admin'
    )
  );

-- RLS: chat_messages
CREATE POLICY "Members can view channel messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channel_members
      WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_channel_members
      WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS: chat_message_reactions
CREATE POLICY "Members can view reactions"
  ON public.chat_message_reactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_channel_members ccm ON ccm.channel_id = m.channel_id
      WHERE m.id = chat_message_reactions.message_id AND ccm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add reactions"
  ON public.chat_message_reactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_channel_members ccm ON ccm.channel_id = m.channel_id
      WHERE m.id = chat_message_reactions.message_id AND ccm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their reactions"
  ON public.chat_message_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS: chat_mentions
CREATE POLICY "Users can view their mentions"
  ON public.chat_mentions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Members can create mentions"
  ON public.chat_mentions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_channel_members ccm ON ccm.channel_id = m.channel_id
      WHERE m.id = chat_mentions.message_id AND ccm.user_id = auth.uid()
    )
  );

-- Storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

CREATE POLICY "Authenticated users can upload chat files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can view chat files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files');

CREATE POLICY "Users can delete their chat files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
