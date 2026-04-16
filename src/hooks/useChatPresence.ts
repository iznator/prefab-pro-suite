import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceState {
  user_id: string;
  display_name: string;
  online_at: string;
}

interface TypingState {
  user_id: string;
  display_name: string;
}

/**
 * Tracks online presence and typing indicators for a channel using Supabase Realtime.
 * No database required — uses ephemeral Presence + Broadcast.
 */
export function useChatPresence(channelId: string | null) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([]);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!channelId || !user) {
      setOnlineUsers([]);
      setTypingUsers([]);
      return;
    }

    const channel = supabase.channel(`presence-${channelId}`, {
      config: { presence: { key: user.id } },
    });

    // Track presence (online users)
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceState>();
      const users: PresenceState[] = [];
      Object.values(state).forEach((presences: any[]) => {
        presences.forEach(p => {
          if (p.user_id !== user.id) {
            users.push(p);
          }
        });
      });
      setOnlineUsers(users);
    });

    // Track typing via broadcast
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload.user_id === user.id) return;

      setTypingUsers(prev => {
        const exists = prev.find(t => t.user_id === payload.user_id);
        if (!exists) {
          return [...prev, { user_id: payload.user_id, display_name: payload.display_name }];
        }
        return prev;
      });

      // Clear typing after 3s
      const existing = typingTimeouts.current.get(payload.user_id);
      if (existing) clearTimeout(existing);
      typingTimeouts.current.set(payload.user_id, setTimeout(() => {
        setTypingUsers(prev => prev.filter(t => t.user_id !== payload.user_id));
        typingTimeouts.current.delete(payload.user_id);
      }, 3000));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      typingTimeouts.current.forEach(t => clearTimeout(t));
      typingTimeouts.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelId, user]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
      },
    });
  }, [user]);

  return { onlineUsers, typingUsers, sendTyping };
}

/**
 * Track global online presence (for channel list sidebar)
 */
export function useGlobalPresence() {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("global-presence", {
      config: { presence: { key: user.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const ids = new Set<string>();
      Object.values(state).forEach((presences: any[]) => {
        presences.forEach(p => ids.add(p.user_id));
      });
      setOnlineUserIds(ids);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return onlineUserIds;
}
