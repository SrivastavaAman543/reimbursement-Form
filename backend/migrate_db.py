from sqlalchemy import create_engine, text
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE expense_items ADD COLUMN approx_amount FLOAT DEFAULT 0.0"))
        conn.commit()
        print("Column approx_amount added successfully")
    except Exception as e:
        print(f"Error: {e}")
