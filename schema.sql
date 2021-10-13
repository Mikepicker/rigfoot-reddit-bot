CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id TEXT NOT NULL,
  UNIQUE(comment_id)
);

