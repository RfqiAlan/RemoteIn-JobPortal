"""
Migration: make requested_by nullable and add client_identifier to external_sync_requests
Run once on the Railway/production database.
"""
import os
import pymysql

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = int(os.getenv("DB_PORT", "3306"))
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "remotein")

conn = pymysql.connect(
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
)

with conn.cursor() as cur:
    # 1. Ubah requested_by menjadi nullable
    cur.execute("""
        ALTER TABLE external_sync_requests
        MODIFY COLUMN requested_by INT NULL;
    """)
    print("✅ requested_by is now nullable")

    # 2. Tambah kolom client_identifier jika belum ada
    cur.execute("""
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = %s
          AND TABLE_NAME = 'external_sync_requests'
          AND COLUMN_NAME = 'client_identifier'
    """, (DB_NAME,))
    (col_exists,) = cur.fetchone()

    if col_exists == 0:
        cur.execute("""
            ALTER TABLE external_sync_requests
            ADD COLUMN client_identifier VARCHAR(255) NULL,
            ADD INDEX idx_client_identifier (client_identifier);
        """)
        print("✅ client_identifier column added")
    else:
        print("⚠️  client_identifier already exists, skipped")

conn.commit()
conn.close()
print("✅ Migration complete")
