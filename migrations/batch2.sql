-- 批次 2 迁移：公告与默认主页
CREATE TABLE IF NOT EXISTS notices(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status INTEGER NOT NULL DEFAULT 1,
  time_code TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS default_data(
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
