-- SQLite has limited ALTER TABLE support (no MODIFY COLUMN, DROP COLUMN only on SQLite >= 3.35).
-- Future migrations that need to change a column should use the "create new table, copy data,
-- drop old table, rename" pattern rather than ALTER TABLE ... MODIFY/DROP COLUMN.
--
-- Hibernate's community SQLite dialect reads/writes LocalDate/LocalDateTime columns as full
-- "YYYY-MM-DD HH:MM:SS.ffffff" text, not a bare date string. Only matters for hand-written SQL
-- literals (seed data, manual fixes) -- inserts made through JPA entities handle this
-- automatically. Don't hand-write a bare "YYYY-MM-DD" literal into date/transaction_datetime.

CREATE TABLE categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE category_matching_rules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    keyword     TEXT NOT NULL,
    UNIQUE (category_id, keyword)
);

CREATE TABLE daily_balances (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    date                 TEXT NOT NULL UNIQUE,       -- LocalDate
    balance              INTEGER NOT NULL,            -- end-of-day balance, whole HUF
    balance_set_manually INTEGER NOT NULL DEFAULT 0,  -- boolean 0/1
    predicted            INTEGER NOT NULL DEFAULT 0,
    reviewed             INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE transactions (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    daily_balance_id      INTEGER NOT NULL REFERENCES daily_balances(id) ON DELETE CASCADE,
    type                  TEXT NOT NULL,               -- raw bank transaction type
    transaction_datetime  TEXT,                        -- nullable LocalDateTime
    amount                INTEGER NOT NULL,
    account_number        TEXT NOT NULL DEFAULT '',
    owner                 TEXT NOT NULL DEFAULT '',
    comment               TEXT NOT NULL DEFAULT '',
    category_id           INTEGER REFERENCES categories(id)  -- nullable
);
CREATE INDEX idx_transactions_daily_balance_id ON transactions(daily_balance_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

CREATE TABLE corrections (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    daily_balance_id       INTEGER NOT NULL REFERENCES daily_balances(id) ON DELETE CASCADE,
    category_id            INTEGER NOT NULL REFERENCES categories(id),
    comment                TEXT NOT NULL DEFAULT '',
    amount                 INTEGER NOT NULL,
    only_move              INTEGER NOT NULL DEFAULT 0,
    paired_transaction_id  INTEGER REFERENCES transactions(id)  -- nullable; NULL = unpaired
);
CREATE INDEX idx_corrections_daily_balance_id ON corrections(daily_balance_id);
CREATE INDEX idx_corrections_category_id ON corrections(category_id);
CREATE INDEX idx_corrections_paired_transaction_id ON corrections(paired_transaction_id);
