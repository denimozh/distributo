-- Migration: Add avatar three-angle references and ElevenLabs voice IDs
-- Also add audio columns to videos table for the new pipeline

-- ===========================================
-- AVATARS TABLE UPDATES
-- ===========================================

-- Add three-angle reference images for Kling Elements consistency
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS image_front TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS image_side TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS image_profile TEXT;

-- Add ElevenLabs voice ID for each avatar
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS elevenlabs_voice_id TEXT;

-- Add physical description for Kling Elements
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS physical_description TEXT;

-- ===========================================
-- VIDEOS TABLE UPDATES
-- ===========================================

-- Add audio URL for ElevenLabs voiceover
ALTER TABLE videos ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Track whether video has audio and captions
ALTER TABLE videos ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS has_captions BOOLEAN DEFAULT false;

-- Caption style used
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_style TEXT DEFAULT 'tiktok';

-- ===========================================
-- CAMPAIGNS TABLE UPDATES
-- ===========================================

-- Add product footage URL for hook + demo composites
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS product_footage_url TEXT;

-- ===========================================
-- UPDATE PRESET AVATARS WITH VOICE IDS
-- ===========================================

-- Female avatars
UPDATE avatars SET elevenlabs_voice_id = 'EXAVITQu4vr4xnSDxMaL' WHERE LOWER(name) = 'alex';
UPDATE avatars SET elevenlabs_voice_id = 'EXAVITQu4vr4xnSDxMaL' WHERE LOWER(name) = 'emma';
UPDATE avatars SET elevenlabs_voice_id = 'jBpfuIE2acCO8z3wKNLl' WHERE LOWER(name) = 'lisa';
UPDATE avatars SET elevenlabs_voice_id = 'jBpfuIE2acCO8z3wKNLl' WHERE LOWER(name) = 'maria';
UPDATE avatars SET elevenlabs_voice_id = 'ThT5KcBeYPX3keUQqHPh' WHERE LOWER(name) = 'nina';
UPDATE avatars SET elevenlabs_voice_id = 'jsCqWAovK2LkecY7zXl4' WHERE LOWER(name) = 'sophie';

-- Male avatars
UPDATE avatars SET elevenlabs_voice_id = 'VR6AewLTigWG4xSOukaG' WHERE LOWER(name) = 'chris';
UPDATE avatars SET elevenlabs_voice_id = 'nPczCjzI2devNBSz7Koi' WHERE LOWER(name) = 'david';
UPDATE avatars SET elevenlabs_voice_id = 'pqHfZKP75CvOlQylNhV4' WHERE LOWER(name) = 'james';
UPDATE avatars SET elevenlabs_voice_id = 'N2lVS1w4EtoT3dr4eOWO' WHERE LOWER(name) = 'marcus';

-- ===========================================
-- STORAGE BUCKETS
-- ===========================================

-- Create audio bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Set policy for audio bucket
CREATE POLICY IF NOT EXISTS "Allow public read access on audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');
