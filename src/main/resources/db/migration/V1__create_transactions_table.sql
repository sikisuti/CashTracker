-- SQLite has limited ALTER TABLE support (no MODIFY COLUMN, DROP COLUMN only on SQLite >= 3.35).
-- Future migrations that need to change a column should use the "create new table, copy data,
-- drop old table, rename" pattern rather than ALTER TABLE ... MODIFY/DROP COLUMN.

CREATE TABLE transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount      NUMERIC NOT NULL,
    txn_date    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
