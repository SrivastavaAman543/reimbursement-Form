from database import engine, Base
import models
from auth import hash_password
from sqlalchemy import text

def recreate():
    with engine.connect() as conn:
        print("Disabling foreign key checks...")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # Manually drop all tables to handle tables not in metadata (like 'expenses')
        print("Fetching all table names...")
        result = conn.execute(text("SHOW TABLES;"))
        tables = [row[0] for row in result]
        for table in tables:
            print(f"Dropping table: {table}")
            conn.execute(text(f"DROP TABLE IF EXISTS `{table}`;"))
            
        print("Creating all tables from models...")
        Base.metadata.create_all(bind=engine)
        
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit()
    
    from database import SessionLocal
    db = SessionLocal()
    try:
        # Create default admin
        admin = models.User(
            username="admin",
            email="admin@example.com",
            hashed_password=hash_password("admin123"),
            user_role="ADMIN"
        )
        db.add(admin)
        
        # Create default manager
        manager = models.User(
            username="manager",
            email="manager@example.com",
            hashed_password=hash_password("manager123"),
            user_role="MANAGER"
        )
        db.add(manager)

        # Create default requester
        requester = models.User(
            username="requester",
            email="requester@example.com",
            hashed_password=hash_password("requester123"),
            user_role="REQUESTER"
        )
        db.add(requester)
        
        db.commit()
        print("Default users created: admin/admin123, manager/manager123, requester/requester123")
    except Exception as e:
        print(f"Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recreate()
