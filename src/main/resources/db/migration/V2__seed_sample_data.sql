-- Hibernate's community SQLite dialect reads/writes LocalDate columns as full
-- "YYYY-MM-DD HH:MM:SS.ffffff" text, not a bare date string, so seed data must match.
INSERT INTO transactions (description, amount, txn_date) VALUES
    ('Grocery shopping', -54.32, '2026-08-10 00:00:00.000000'),
    ('Salary', 2500.00, '2026-08-01 00:00:00.000000'),
    ('Electricity bill', -87.15, '2026-08-05 00:00:00.000000');
