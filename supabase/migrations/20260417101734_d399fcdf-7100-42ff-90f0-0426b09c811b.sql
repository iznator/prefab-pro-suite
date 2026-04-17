-- Allow channel creators (and admins) to update/delete their channels
DROP POLICY IF EXISTS "Channel admins can delete channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Channel admins can update channels" ON public.chat_channels;

CREATE POLICY "Creators or admins can delete channels"
  ON public.chat_channels FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_channel_admin(id, auth.uid()));

CREATE POLICY "Creators or admins can update channels"
  ON public.chat_channels FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_channel_admin(id, auth.uid()));

-- Allow message deletion when the user is the channel creator (cleanup on channel delete)
DROP POLICY IF EXISTS "Channel creators can delete channel messages" ON public.chat_messages;
CREATE POLICY "Channel creators can delete channel messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id AND c.created_by = auth.uid()
    )
    OR public.is_channel_admin(channel_id, auth.uid())
  );

-- Allow channel members table cleanup by channel creator
DROP POLICY IF EXISTS "Creators can remove members" ON public.chat_channel_members;
CREATE POLICY "Creators can remove members"
  ON public.chat_channel_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_channel_admin(channel_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_channel_members.channel_id AND c.created_by = auth.uid()
    )
  );

-- Drop the now-redundant old delete policy on members to avoid duplication
DROP POLICY IF EXISTS "Channel admins can remove members" ON public.chat_channel_members;