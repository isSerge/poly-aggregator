CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  liquidity REAL NOT NULL DEFAULT 0,
  volume REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (liquidity >= 0),
  CHECK (volume >= 0)
);

CREATE TABLE IF NOT EXISTS child_markets (
  id TEXT PRIMARY KEY,
  parent_market_id TEXT NOT NULL,
  question TEXT NOT NULL,
  outcomes TEXT NOT NULL,
  outcome_prices TEXT NOT NULL,
  volume REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (volume >= 0),
  CHECK (json_valid(outcomes)),
  CHECK (json_valid(outcome_prices)),
  FOREIGN KEY (parent_market_id) REFERENCES markets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_child_markets_parent_id 
  ON child_markets(parent_market_id);

CREATE INDEX IF NOT EXISTS idx_reports_date 
  ON reports(created_at DESC);