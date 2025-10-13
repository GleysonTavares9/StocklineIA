-- Add fields for cover functionality
ALTER TABLE songs ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS original_audio_url TEXT;

-- Update existing songs to have is_cover = false
UPDATE songs SET is_cover = false WHERE is_cover IS NULL;
