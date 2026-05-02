from database import engine

def migrate():
    with engine.begin() as conn:
        if engine.dialect.name == "mysql":
            print("Migrating MySQL users table to support 'admin' role in ENUM...")
            conn.exec_driver_sql("ALTER TABLE users MODIFY COLUMN role ENUM('jobseeker', 'employer', 'admin') NOT NULL DEFAULT 'jobseeker'")
            print("Successfully migrated.")
        else:
            print("Not using MySQL. SQLite handles ENUMs automatically in python. No action needed.")

if __name__ == "__main__":
    migrate()
