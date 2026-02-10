-- Mutt off-chain data
CREATE TABLE mutts (
  token_id INTEGER PRIMARY KEY,
  personality VARCHAR(4) NOT NULL,
  personality_desc TEXT,
  identity TEXT,
  bloodline VARCHAR(20) DEFAULT 'mutt',
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  color VARCHAR(30),
  expression VARCHAR(30),
  accessory VARCHAR(30),
  image VARCHAR(100),
  parent_a INTEGER DEFAULT 0,
  parent_b INTEGER DEFAULT 0,
  breeder VARCHAR(42) NOT NULL,
  pureblood_route JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES mutts(token_id),
  voter VARCHAR(42) NOT NULL,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_id, voter)
);

-- Activity log
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  actor VARCHAR(42) NOT NULL,
  token_id INTEGER REFERENCES mutts(token_id),
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mutts_breeder ON mutts(breeder);
CREATE INDEX idx_mutts_bloodline ON mutts(bloodline);
CREATE INDEX idx_mutts_avg_rating ON mutts(avg_rating DESC);
CREATE INDEX idx_ratings_token ON ratings(token_id);
CREATE INDEX idx_activities_actor ON activities(actor);
CREATE INDEX idx_activities_token ON activities(token_id);
