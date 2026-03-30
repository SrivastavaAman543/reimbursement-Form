import traceback
from database import engine, Base
import models

def debug():
    try:
        print("Checking tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print("ERROR during create_all:")
        traceback.print_exc()

if __name__ == "__main__":
    debug()
