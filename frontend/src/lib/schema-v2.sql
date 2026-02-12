-- Migration v2: pending_actions, holdings, mutts extension

-- 1. pending_actions (stores API results between signature and sync)
CREATE TABLE IF NOT EXISTS pending_actions (
  id SERIAL PRIMARY KEY,
  nonce BIGINT NOT NULL,
  address TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('hatch', 'breed')),
  personality SMALLINT NOT NULL,
  personality_type VARCHAR(4) NOT NULL,
  personality_desc TEXT,
  traits JSONB,
  identity TEXT,
  parent_a INTEGER DEFAULT 0,
  parent_b INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pending_address ON pending_actions(address);

-- 2. holdings (user token balances, synced from on-chain)
CREATE TABLE IF NOT EXISTS holdings (
  address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  balance INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (address, token_id)
);
CREATE INDEX IF NOT EXISTS idx_holdings_address ON holdings(address);

-- 3. Extend mutts table
ALTER TABLE mutts ADD COLUMN IF NOT EXISTS mint_cost TEXT DEFAULT '0';
ALTER TABLE mutts ADD COLUMN IF NOT EXISTS max_supply INTEGER DEFAULT 0;
ALTER TABLE mutts ADD COLUMN IF NOT EXISTS total_supply INTEGER DEFAULT 1;

-- 4. Drop FK constraint on activities.token_id so sync can insert activities
--    before or independently of mutts
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_token_id_fkey;
