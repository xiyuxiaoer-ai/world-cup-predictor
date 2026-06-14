-- Run this in Supabase SQL Editor

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('group', 'direct')),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- One group chat per game
CREATE UNIQUE INDEX conv_group_unique ON conversations (game_id) WHERE type = 'group';
-- One DM per user pair per game (user1_id < user2_id enforced in app code)
CREATE UNIQUE INDEX conv_direct_unique ON conversations (game_id, user1_id, user2_id) WHERE type = 'direct';

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game members read conversations" ON conversations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM game_members WHERE game_id = conversations.game_id AND user_id = auth.uid())
  );
CREATE POLICY "game members create conversations" ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM game_members WHERE game_id = conversations.game_id AND user_id = auth.uid())
  );

-- Messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game members read messages" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN game_members gm ON gm.game_id = c.game_id
      WHERE c.id = messages.conversation_id AND gm.user_id = auth.uid()
    )
  );
CREATE POLICY "sender can insert messages" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN game_members gm ON gm.game_id = c.game_id
      WHERE c.id = messages.conversation_id AND gm.user_id = auth.uid()
    )
  );

-- Track last-read time per user per conversation (for unread badge)
CREATE TABLE message_reads (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own reads" ON message_reads FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
