-- 批次 3 迁移：默认主页历史
CREATE TABLE IF NOT EXISTS default_data_history(
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
