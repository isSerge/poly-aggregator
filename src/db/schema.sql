-- Markets Table
CREATE TABLE IF NOT EXISTS markets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    active INTEGER NOT NULL, -- 0 for false, 1 for true
    closed INTEGER NOT NULL, -- 0 for false, 1 for true
    liquidity REAL NOT NULL,
    volume REAL NOT NULL
);

-- Child Markets Table
CREATE TABLE IF NOT EXISTS child_markets (
    id TEXT PRIMARY KEY,
    parent_market_id TEXT NOT NULL REFERENCES markets(id),
    question TEXT NOT NULL,
    outcomes TEXT NOT NULL,        -- Store JSON as text
    outcome_prices TEXT NOT NULL, -- Store JSON as text
    volume REAL NOT NULL,
    active INTEGER,               -- 0 for false, 1 for true
    closed INTEGER                -- 0 for false, 1 for true
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
