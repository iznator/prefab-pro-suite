
-- Allow creator to see their channel (before they're added as member)
DROP POLICY IF EXISTS "Members can view their channels" ON public.chat_channels;
CREATE POLICY "Members can view their channels" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_channel_member(id, auth.uid()));

-- Allow channel creator to add first members
DROP POLICY IF EXISTS "Channel admins can add members" ON public.chat_channel_members;
CREATE POLICY "Channel admins can add members" ON public.chat_channel_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR public.is_channel_admin(channel_id, auth.uid())
    OR EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND c.created_by = auth.uid())
  );
