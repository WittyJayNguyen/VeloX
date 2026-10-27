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
]

for col, defn in columns_to_add:
    if col not in cols:
        print('Adding column:', col)
        cur.execute(f"ALTER TABLE users ADD COLUMN {col} {defn}")

con.commit()
con.close()
print('Migration complete!')
