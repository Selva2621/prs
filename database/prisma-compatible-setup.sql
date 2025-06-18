-- =====================================================
-- COSMIC LOVE DATABASE SETUP - PRISMA COMPATIBLE
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/ftlkchjjbffuqgklxdxm/sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CREATE ENUM TYPES (Prisma Compatible)
-- =====================================================

DO $$ BEGIN
    CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'EMOJI', 'LOCATION', 'PROPOSAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PhotoCategory" AS ENUM ('SELFIE', 'COUPLE', 'MEMORY', 'SPECIAL', 'ANNIVERSARY', 'TRAVEL', 'FAMILY', 'FRIENDS', 'NATURE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'CONNECTED', 'ENDED', 'MISSED', 'DECLINED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProposalType" AS ENUM ('MARRIAGE', 'ANNIVERSARY', 'VALENTINE', 'BIRTHDAY', 'SURPRISE', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CREATE TABLES (Prisma Schema Compatible)
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
    last_seen TIMESTAMPTZ,
    preferences JSONB,
    profile_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    type "MessageType" DEFAULT 'TEXT',
    status "MessageStatus" DEFAULT 'SENT',
    metadata JSONB,
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    description TEXT,
    file_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    file_size INTEGER NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    width INTEGER,
    height INTEGER,
    category "PhotoCategory" DEFAULT 'OTHER',
    metadata JSONB,
    taken_at DATE,
    is_favorite BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video calls table
CREATE TABLE IF NOT EXISTS video_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status "CallStatus" DEFAULT 'INITIATED',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INTEGER DEFAULT 0,
    quality VARCHAR(255) DEFAULT 'HD',
    metadata JSONB,
    is_recorded BOOLEAN DEFAULT false,
    recording_url VARCHAR(255),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type "ProposalType" DEFAULT 'MARRIAGE',
    status "ProposalStatus" DEFAULT 'DRAFT',
    customization JSONB,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response TEXT,
    is_accepted BOOLEAN,
    expires_at TIMESTAMPTZ,
    proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by_id ON photos(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_callee_id ON video_calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer_id ON proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- =====================================================
-- CREATE SAMPLE DATA
-- =====================================================

-- Sample users
INSERT INTO users (email, password, full_name, preferences, profile_data) VALUES 
(
    'lover1@cosmic.love', 
    '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq',
    'My Beloved', 
    '{"theme": "cosmic", "notifications": true, "language": "en"}'::jsonb,
    '{"bio": "Lost in the stars, found in your eyes", "relationship_status": "In a cosmic love story"}'::jsonb
),
(
    'lover2@cosmic.love', 
    '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq',
    'My Darling', 
    '{"theme": "romantic", "notifications": true, "language": "en"}'::jsonb,
    '{"bio": "Your love is my universe", "relationship_status": "Madly in love"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Sample messages
INSERT INTO messages (sender_id, recipient_id, content, type, status) 
SELECT 
    u1.id, u2.id, 'Good morning, my love! ☀️ Hope your day is as beautiful as you are! 💕', 'TEXT', 'READ'
FROM users u1, users u2 
WHERE u1.email = 'lover1@cosmic.love' AND u2.email = 'lover2@cosmic.love'
ON CONFLICT DO NOTHING;

INSERT INTO messages (sender_id, recipient_id, content, type, status) 
SELECT 
    u2.id, u1.id, 'I love you to the moon and back! 🌙✨', 'TEXT', 'READ'
FROM users u1, users u2 
WHERE u1.email = 'lover1@cosmic.love' AND u2.email = 'lover2@cosmic.love'
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check tables
SELECT 'Tables created successfully!' as status;

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'messages', 'photos', 'video_calls', 'proposals')
ORDER BY table_name, ordinal_position;

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

SELECT '🎉 Cosmic Love Database Setup Complete! 🎉' as final_status;
