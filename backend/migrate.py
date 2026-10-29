import sqlite3

con = sqlite3.connect('velox.db')
cur = con.cursor()
cur.execute('PRAGMA table_info(users)')
cols = [r[1] for r in cur.fetchall()]
print('Existing cols in users:', cols)

columns_to_add = [
    ('tier', "VARCHAR(32) DEFAULT 'FREE'"),
    ('failed_login_attempts', 'INTEGER DEFAULT 0'),
    ('locked_until', 'VARCHAR(64)'),
    ('last_login_at', 'VARCHAR(64)'),
    ('last_login_ip', 'VARCHAR(64)'),
    ('token_version', 'INTEGER DEFAULT 1'),
    ('user_code', 'VARCHAR(32)'),
    ('auth_provider', "VARCHAR(32) DEFAULT 'LOCAL'"),
    ('google_id', 'VARCHAR(128)'),
    ('telegram_id', 'VARCHAR(128)'),
    ('telegram_username', 'VARCHAR(128)'),
]

cur.execute('PRAGMA table_info(credit_packages)')
pkg_cols = [r[1] for r in cur.fetchall()]
pkg_cols_to_add = [
    ('category', "VARCHAR(32) DEFAULT 'PRO'"),
    ('description', "VARCHAR(255) DEFAULT ''"),
    ('original_price_vnd', "NUMERIC(12, 0) DEFAULT 0"),
    ('features', "VARCHAR(2000) DEFAULT '[]'"),
    ('tag_badge', "VARCHAR(64) DEFAULT ''"),
    ('sort_order', "INTEGER DEFAULT 0"),
]
for col, defn in pkg_cols_to_add:
    if col not in pkg_cols:
        print('Adding to credit_packages:', col)
        cur.execute(f"ALTER TABLE credit_packages ADD COLUMN {col} {defn}")

con.commit()
con.close()
print('Migration complete!')
