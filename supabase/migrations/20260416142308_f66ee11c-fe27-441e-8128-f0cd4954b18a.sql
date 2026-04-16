ALTER TABLE public.chat_channels
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;