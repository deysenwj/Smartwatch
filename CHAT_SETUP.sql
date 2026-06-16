-- ============================================================
-- CHAT MESSAGES TABLE — SmartWatch Hukum
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_role   TEXT NOT NULL CHECK (from_role IN ('user', 'admin')),
  sender_name TEXT NOT NULL DEFAULT '',
  text        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk query cepat per user
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- ---- Row Level Security (RLS) ----
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- User hanya bisa lihat chat miliknya sendiri
CREATE POLICY "user_see_own_chat" ON chat_messages
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User hanya bisa insert pesan miliknya sendiri (from_role = 'user')
CREATE POLICY "user_insert_own_chat" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND from_role = 'user'
  );

-- Admin bisa insert pesan balasan (from_role = 'admin')
CREATE POLICY "admin_insert_reply" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
    AND from_role = 'admin'
  );

-- Admin bisa update read status
CREATE POLICY "admin_update_read" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User bisa update read untuk pesan dari admin di chatnya
CREATE POLICY "user_update_read" ON chat_messages
  FOR UPDATE USING (
    auth.uid() = user_id AND from_role = 'admin'
  );
