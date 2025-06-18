-- =====================================================
-- COSMIC LOVE DATABASE SETUP FOR SUPABASE
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CREATE ENUM TYPES
-- =====================================================

-- Message related enums
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'audio', 'emoji', 'location', 'proposal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Photo related enums
DO $$ BEGIN
    CREATE TYPE photo_category AS ENUM ('memory', 'selfie', 'together', 'special_moment', 'anniversary', 'proposal', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Call related enums
DO $$ BEGIN
    CREATE TYPE call_status AS ENUM ('initiated', 'ringing', 'answered', 'ended', 'missed', 'declined', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_type AS ENUM ('audio', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Proposal related enums
DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'declined', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proposal_type AS ENUM ('marriage', 'anniversary', 'special_moment', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    birthday DATE,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    type message_type DEFAULT 'text',
    status message_status DEFAULT 'sent',
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    category photo_category DEFAULT 'memory',
    metadata JSONB DEFAULT '{}',
    taken_at DATE,
    is_favorite BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video calls table
CREATE TABLE IF NOT EXISTS video_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type call_type DEFAULT 'video',
    status call_status DEFAULT 'initiated',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    call_data JSONB DEFAULT '{}',
    participants_data JSONB DEFAULT '{}',
    is_recorded BOOLEAN DEFAULT false,
    recording_url TEXT,
    end_reason TEXT,
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type proposal_type DEFAULT 'marriage',
    status proposal_status DEFAULT 'draft',
    customization JSONB DEFAULT '{}',
    media_attachments JSONB DEFAULT '{}',
    timeline JSONB DEFAULT '{}',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_message TEXT,
    analytics JSONB DEFAULT '{}',
    is_surprise BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);

-- Photos indexes
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by_id ON photos(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photos_is_visible ON photos(is_visible);

-- Video calls indexes
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_callee_id ON video_calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_created_at ON video_calls(created_at DESC);

-- Proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_proposer_id ON proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_recipient_id ON proposals(recipient_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- =====================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at 
    BEFORE UPDATE ON photos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_calls_updated_at ON video_calls;
CREATE TRIGGER update_video_calls_updated_at 
    BEFORE UPDATE ON video_calls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at 
    BEFORE UPDATE ON proposals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Photos policies
CREATE POLICY "Users can view photos" ON photos
    FOR SELECT USING (is_visible = true);

CREATE POLICY "Users can upload photos" ON photos
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by_id);

CREATE POLICY "Users can update their own photos" ON photos
    FOR UPDATE USING (auth.uid() = uploaded_by_id);

-- Video calls policies
CREATE POLICY "Users can view their own calls" ON video_calls
    FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create calls" ON video_calls
    FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own calls" ON video_calls
    FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Proposals policies
CREATE POLICY "Users can view their own proposals" ON proposals
    FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create proposals" ON proposals
    FOR INSERT WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Users can update their own proposals" ON proposals
    FOR UPDATE USING (auth.uid() = proposer_id);

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Note: In production, you would create users through the authentication system
-- This is just for testing purposes

-- Sample users (passwords are hashed with bcrypt)
INSERT INTO users (id, email, password, full_name, profile_data) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'lover1@cosmic.love', 
    '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', -- password: 'cosmicLove123'
    'My Beloved', 
    '{"bio": "The love of my life", "relationship_status": "in_love", "anniversary_date": "2024-02-14"}'::jsonb
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'lover2@cosmic.love', 
    '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', -- password: 'cosmicLove123'
    'My Darling', 
    '{"bio": "My universe and stars", "relationship_status": "in_love", "anniversary_date": "2024-02-14"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Sample messages
INSERT INTO messages (sender_id, recipient_id, content, type) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Good morning, my love! ☀️', 'text'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Good morning beautiful! 💖', 'text'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'I can''t wait to see you tonight under the stars ✨', 'text')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'messages', 'photos', 'video_calls', 'proposals')
ORDER BY tablename;

-- Check sample data
SELECT 'Users' as table_name, count(*) as record_count FROM users
UNION ALL
SELECT 'Messages' as table_name, count(*) as record_count FROM messages
UNION ALL
SELECT 'Photos' as table_name, count(*) as record_count FROM photos
UNION ALL
SELECT 'Video Calls' as table_name, count(*) as record_count FROM video_calls
UNION ALL
SELECT 'Proposals' as table_name, count(*) as record_count FROM proposals;

-- Success message
SELECT '🎉 Cosmic Love Database Setup Complete! 🎉' as status;
