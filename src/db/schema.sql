CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  active INTEGER NOT NULL,
  closed INTEGER NOT NULL,
  liquidity REAL,
  volume REAL
);

CREATE TABLE IF NOT EXISTS child_markets (
  id TEXT PRIMARY KEY,
  parent_market_id TEXT NOT NULL,
  question TEXT NOT NULL,
  outcomes TEXT NOT NULL,
  outcome_prices TEXT NOT NULL,
  volume REAL,
  active INTEGER NOT NULL,
  closed INTEGER NOT NULL,
  FOREIGN KEY (parent_market_id) REFERENCES markets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
