-- Migration: Add content pillars system
-- Replaces hook types with strategic content pillars
-- Auto-generates 50 content angles per campaign

-- ===========================================
-- HOOKS TABLE UPDATES
-- ===========================================

-- Add pillar tracking to hooks
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS pillar_id TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS pillar_name TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS angle TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS delivery_mechanism TEXT;

-- ===========================================
-- CONTENT ANGLES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS content_angles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Pillar info
  pillar_id TEXT NOT NULL,
  pillar_name TEXT NOT NULL,
  
  -- Angle content
  angle_template TEXT NOT NULL,
  angle_personalized TEXT NOT NULL,
  
  -- Delivery mechanism (how to present)
  delivery_mechanism TEXT DEFAULT 'discovery',
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Performance (updated by feedback loop)
  avg_engagement_rate DECIMAL(5,4),
  avg_watch_time DECIMAL(5,2),
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  
  -- Scoring
  performance_score DECIMAL(5,4),
  is_winner BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_content_angles_campaign ON content_angles(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_angles_pillar ON content_angles(pillar_id);
CREATE INDEX IF NOT EXISTS idx_content_angles_winner ON content_angles(is_winner) WHERE is_winner = true;
CREATE INDEX IF NOT EXISTS idx_content_angles_performance ON content_angles(performance_score DESC NULLS LAST);

-- ===========================================
-- CAMPAIGNS TABLE UPDATES
-- ===========================================

-- Add business type to campaigns (needed for pillar selection)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'ecommerce';

-- Add pillar tracking
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS pillars_generated BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS pillar_count INTEGER DEFAULT 5;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS angle_count INTEGER DEFAULT 50;

-- ===========================================
-- VIDEOS TABLE UPDATES
-- ===========================================

-- Link videos to content angles
ALTER TABLE videos ADD COLUMN IF NOT EXISTS content_angle_id UUID REFERENCES content_angles(id);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS pillar_id TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS delivery_mechanism TEXT;

-- ===========================================
-- PROFILES TABLE UPDATES
-- ===========================================

-- Store business type at user level
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'ecommerce';

-- ===========================================
-- PERFORMANCE INSIGHTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS pillar_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pillar performance summary
  pillar_id TEXT NOT NULL,
  pillar_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  
  -- Aggregated metrics
  total_videos INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,4),
  avg_watch_time DECIMAL(5,2),
  
  -- Top performing angles
  top_angles JSONB DEFAULT '[]',
  
  -- Week-over-week trends
  wow_engagement_change DECIMAL(5,4),
  wow_views_change DECIMAL(5,4),
  
  -- Calculated weekly
  week_start DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, pillar_id, week_start)
);

-- Index for weekly rollup
CREATE INDEX IF NOT EXISTS idx_pillar_insights_week ON pillar_insights(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_pillar_insights_pillar ON pillar_insights(pillar_id);

-- ===========================================
-- WINNING PATTERNS TABLE
-- ===========================================

-- Stores patterns that work for injection into future prompts
CREATE TABLE IF NOT EXISTS winning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pattern identification
  pattern_type TEXT NOT NULL, -- 'pillar', 'angle', 'hook_phrase', 'cta_style'
  pattern_value TEXT NOT NULL,
  
  -- Context
  business_type TEXT,
  target_audience TEXT,
  pillar_id TEXT,
  
  -- Performance
  sample_size INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,4),
  confidence_score DECIMAL(3,2), -- 0-1, higher = more data
  
  -- Usage
  times_injected INTEGER DEFAULT 0,
  last_injected_at TIMESTAMPTZ,
  
  -- Active status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for prompt injection lookup
CREATE INDEX IF NOT EXISTS idx_winning_patterns_lookup 
  ON winning_patterns(user_id, is_active, pattern_type, confidence_score DESC);

-- ===========================================
-- HELPER FUNCTION: Update angle performance
-- ===========================================

CREATE OR REPLACE FUNCTION update_angle_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- When video stats update, recalculate angle performance
  UPDATE content_angles
  SET 
    total_views = total_views + COALESCE(NEW.views, 0) - COALESCE(OLD.views, 0),
    total_likes = total_likes + COALESCE(NEW.likes, 0) - COALESCE(OLD.likes, 0),
    total_comments = total_comments + COALESCE(NEW.comments, 0) - COALESCE(OLD.comments, 0),
    total_shares = total_shares + COALESCE(NEW.shares, 0) - COALESCE(OLD.shares, 0),
    avg_engagement_rate = CASE 
      WHEN total_views > 0 
      THEN (total_likes + total_comments + total_shares)::DECIMAL / total_views
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = NEW.content_angle_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on video stats update
DROP TRIGGER IF EXISTS trigger_angle_performance ON videos;
CREATE TRIGGER trigger_angle_performance
  AFTER UPDATE OF views, likes, comments, shares ON videos
  FOR EACH ROW
  WHEN (NEW.content_angle_id IS NOT NULL)
  EXECUTE FUNCTION update_angle_performance();
