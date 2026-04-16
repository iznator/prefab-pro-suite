
-- Create a SECURITY DEFINER function to check channel membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id
  );
$$;

-- Create a SECURITY DEFINER function to check channel admin
CREATE OR REPLACE FUNCTION public.is_channel_admin(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id AND role = 'admin'
  );
$$;

-- Fix chat_channel_members policies
DROP POLICY IF EXISTS "Members can view channel members" ON public.chat_channel_members;
CREATE POLICY "Members can view channel members" ON public.chat_channel_members
  FOR SELECT TO authenticated
  USING (public.is_channel_member(channel_id, auth.uid()));

DROP POLICY IF EXISTS "Channel admins can add members" ON public.chat_channel_members;
CREATE POLICY "Channel admins can add members" ON public.chat_channel_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_channel_admin(channel_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Channel admins can remove members" ON public.chat_channel_members;
CREATE POLICY "Channel admins can remove members" ON public.chat_channel_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));

-- Fix chat_channels policies
DROP POLICY IF EXISTS "Members can view their channels" ON public.chat_channels;
CREATE POLICY "Members can view their channels" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (public.is_channel_member(id, auth.uid()));

DROP POLICY IF EXISTS "Channel admins can update channels" ON public.chat_channels;
CREATE POLICY "Channel admins can update channels" ON public.chat_channels
  FOR UPDATE TO authenticated
  USING (public.is_channel_admin(id, auth.uid()));

DROP POLICY IF EXISTS "Channel admins can delete channels" ON public.chat_channels;
CREATE POLICY "Channel admins can delete channels" ON public.chat_channels
  FOR DELETE TO authenticated
  USING (public.is_channel_admin(id, auth.uid()));

-- Fix chat_messages policies
DROP POLICY IF EXISTS "Members can view channel messages" ON public.chat_messages;
CREATE POLICY "Members can view channel messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.is_channel_member(channel_id, auth.uid()));

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_channel_member(channel_id, auth.uid()));

-- Fix chat_message_reactions policies
DROP POLICY IF EXISTS "Members can view reactions" ON public.chat_message_reactions;
CREATE POLICY "Members can view reactions" ON public.chat_message_reactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_messages m
    WHERE m.id = chat_message_reactions.message_id
    AND public.is_channel_member(m.channel_id, auth.uid())
  ));

DROP POLICY IF EXISTS "Members can add reactions" ON public.chat_message_reactions;
CREATE POLICY "Members can add reactions" ON public.chat_message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM chat_messages m
    WHERE m.id = chat_message_reactions.message_id
    AND public.is_channel_member(m.channel_id, auth.uid())
  ));

-- Fix chat_mentions policies
DROP POLICY IF EXISTS "Members can create mentions" ON public.chat_mentions;
CREATE POLICY "Members can create mentions" ON public.chat_mentions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_messages m
    WHERE m.id = chat_mentions.message_id
    AND public.is_channel_member(m.channel_id, auth.uid())
  ));
