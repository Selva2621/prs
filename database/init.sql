-- Cosmic Love Database Initialization Script
-- This script creates all necessary tables for the romantic application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'audio', 'emoji', 'location', 'proposal');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE photo_category AS ENUM ('memory', 'selfie', 'together', 'special_moment', 'anniversary', 'proposal', 'other');
CREATE TYPE call_status AS ENUM ('initiated', 'ringing', 'answered', 'ended', 'missed', 'declined', 'failed');
CREATE TYPE call_type AS ENUM ('audio', 'video');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'declined', 'pending');
CREATE TYPE proposal_type AS ENUM ('marriage', 'anniversary', 'special_moment', 'custom');

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
    last_seen TIMESTAMP,
    preferences JSONB,
    profile_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    type message_type DEFAULT 'text',
    status message_status DEFAULT 'sent',
    metadata JSONB,
    read_at TIMESTAMP,
    delivered_at TIMESTAMP,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    metadata JSONB,
    taken_at DATE,
    is_favorite BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video calls table
CREATE TABLE IF NOT EXISTS video_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type call_type DEFAULT 'video',
    status call_status DEFAULT 'initiated',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    call_data JSONB,
    participants_data JSONB,
    is_recorded BOOLEAN DEFAULT false,
    recording_url TEXT,
    end_reason TEXT,
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type proposal_type DEFAULT 'marriage',
    status proposal_status DEFAULT 'draft',
    customization JSONB,
    media_attachments JSONB,
    timeline JSONB,
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    response_message TEXT,
    analytics JSONB,
    is_surprise BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by_id ON photos(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);

CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_callee_id ON video_calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_created_at ON video_calls(created_at);

CREATE INDEX IF NOT EXISTS idx_proposals_proposer_id ON proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_recipient_id ON proposals(recipient_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_calls_updated_at BEFORE UPDATE ON video_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, password, full_name, profile_data) VALUES 
('lover1@cosmic.love', '$2b$10$example_hash_1', 'My Beloved', '{"bio": "The love of my life", "relationship_status": "in_love"}'),
('lover2@cosmic.love', '$2b$10$example_hash_2', 'My Darling', '{"bio": "My universe and stars", "relationship_status": "in_love"}')
ON CONFLICT (email) DO NOTHING;
