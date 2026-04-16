import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: "channel" | "dm";
  created_by: string;
  created_at: string;
  updated_at: string;
  unread?: number;
  last_message?: string;
  last_message_at?: string;
  members?: ChannelMember[];
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  type: "text" | "image" | "file" | "link";
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  reply_to_id: string | null;
  is_pinned?: boolean;
  edited_at?: string | null;
  created_at: string;
  updated_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
  reply_to?: ChatMessage | null;
  reactions?: { emoji: string; user_id: string }[];
}

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchChannels = useCallback(async () => {
    if (!user) return;

    // Fetch channels + last read position
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*, chat_channel_members(user_id)")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching channels:", error);
      return;
    }

    // Fetch read positions for this user
    const channelIds = (data || []).map(c => c.id);
    const { data: reads } = channelIds.length > 0
      ? await supabase
          .from("chat_channel_reads")
          .select("channel_id, last_read_at")
          .eq("user_id", user.id)
          .in("channel_id", channelIds)
      : { data: [] };

    const readMap = new Map((reads || []).map(r => [r.channel_id, r.last_read_at]));

    // Count unread messages per channel
    const channelsWithUnread = await Promise.all(
      (data || []).map(async (ch: any) => {
        const lastRead = readMap.get(ch.id);
        if (!lastRead) {
          // Never read = count all messages
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("channel_id", ch.id);
          return { ...ch, unread: count || 0 };
        }
        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", ch.id)
          .gt("created_at", lastRead);
        return { ...ch, unread: count || 0 };
      })
    );

    setChannels(channelsWithUnread);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Listen for new messages across all channels to update unread counts
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-global-unreads")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      }, () => {
        fetchChannels();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchChannels]);

  const createChannel = async (name: string, description: string, memberIds: string[], type: "channel" | "dm" = "channel") => {
    if (!user) return null;

    const { data: channel, error } = await supabase
      .from("chat_channels")
      .insert({ name, description, type, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la création du channel");
      console.error(error);
      return null;
    }

    const members = [
      { channel_id: channel.id, user_id: user.id, role: "admin" as const },
      ...memberIds.filter(id => id !== user.id).map(id => ({
        channel_id: channel.id,
        user_id: id,
        role: "member" as const,
      })),
    ];

    const { error: memberError } = await supabase
      .from("chat_channel_members")
      .insert(members);

    if (memberError) console.error("Error adding members:", memberError);

    await fetchChannels();
    toast.success(`Channel #${name} créé !`);
    return channel;
  };

  return { channels, loading, createChannel, refreshChannels: fetchChannels };
}

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!channelId) { setMessages([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((data || []).map(m => m.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const msgIds = (data || []).map(m => m.id);
    const { data: reactions } = msgIds.length > 0
      ? await supabase.from("chat_message_reactions").select("message_id, emoji, user_id").in("message_id", msgIds)
      : { data: [] };

    const reactionMap = new Map<string, { emoji: string; user_id: string }[]>();
    (reactions || []).forEach(r => {
      const list = reactionMap.get(r.message_id) || [];
      list.push({ emoji: r.emoji, user_id: r.user_id });
      reactionMap.set(r.message_id, list);
    });

    const replyIds = (data || []).filter(m => m.reply_to_id).map(m => m.reply_to_id!);
    const { data: replyMsgs } = replyIds.length > 0
      ? await supabase.from("chat_messages").select("*").in("id", replyIds)
      : { data: [] };
    const replyMap = new Map((replyMsgs || []).map(m => [m.id, m]));

    const enriched: ChatMessage[] = (data || []).map(m => ({
      ...m,
      type: m.type as ChatMessage["type"],
      is_pinned: m.is_pinned || false,
      edited_at: m.edited_at || null,
      profile: profileMap.get(m.user_id) || null,
      reactions: reactionMap.get(m.id) || [],
      reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) || null : null,
    }));

    setMessages(enriched);
    setLoading(false);
  }, [channelId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Mark channel as read when viewing
  useEffect(() => {
    if (!channelId || !user) return;
    const markRead = async () => {
      await supabase.from("chat_channel_reads").upsert(
        { channel_id: channelId, user_id: user.id, last_read_at: new Date().toISOString() },
        { onConflict: "channel_id,user_id" }
      );
    };
    markRead();
    // Mark read again when messages change
    const interval = setInterval(markRead, 10000);
    return () => clearInterval(interval);
  }, [channelId, user, messages.length]);

  // Realtime
  useEffect(() => {
    if (!channelId) return;
    const channel = supabase
      .channel(`chat-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` }, () => { fetchMessages(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_message_reactions" }, () => { fetchMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelId, fetchMessages]);

  const sendMessage = async (content: string, type: "text" | "image" | "file" | "link" = "text", fileUrl?: string, fileName?: string, fileType?: string, replyToId?: string) => {
    if (!user || !channelId) return;

    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId, channel_id: channelId, user_id: user.id, content, type,
      file_url: fileUrl || null, file_name: fileName || null, file_type: fileType || null,
      reply_to_id: replyToId || null, is_pinned: false, edited_at: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      profile: null, reactions: [],
      reply_to: replyToId ? messages.find(m => m.id === replyToId) || null : null,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { error } = await supabase.from("chat_messages").insert({
      channel_id: channelId, user_id: user.id, content, type,
      file_url: fileUrl || null, file_name: fileName || null, file_type: fileType || null,
      reply_to_id: replyToId || null,
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      toast.error("Erreur lors de l'envoi");
      console.error(error);
    }

    supabase.from("chat_channels").update({ updated_at: new Date().toISOString() }).eq("id", channelId);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("chat_message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from("chat_message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("chat_message_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
    }
  };

  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await supabase.from("chat_messages").delete().eq("id", messageId);
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!user) return;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m));
    await supabase.from("chat_messages").update({ content: newContent, edited_at: new Date().toISOString() }).eq("id", messageId);
  };

  const togglePin = async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const newPinned = !msg.is_pinned;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_pinned: newPinned } : m));
    await supabase.from("chat_messages").update({ is_pinned: newPinned }).eq("id", messageId);
    toast.success(newPinned ? "Message épinglé" : "Message désépinglé");
  };

  return { messages, loading, sendMessage, addReaction, deleteMessage, editMessage, togglePin, refreshMessages: fetchMessages };
}

export function useChannelMembers(channelId: string | null) {
  const [members, setMembers] = useState<ChannelMember[]>([]);

  useEffect(() => {
    if (!channelId) { setMembers([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("chat_channel_members").select("*").eq("channel_id", channelId);
      if (!data) return;
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setMembers(data.map(m => ({ ...m, role: m.role as "admin" | "member", profile: profileMap.get(m.user_id) || undefined })));
    };
    fetch();
  }, [channelId]);

  return members;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<{ user_id: string; display_name: string | null; avatar_url: string | null }[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("user_id, display_name, avatar_url").then(({ data }) => { setProfiles(data || []); });
  }, []);
  return profiles;
}
