from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from datetime import datetime
import datetime as dt
from database import Base

def get_utc_now():
    return datetime.now(dt.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    user_role = Column(String(20), default="REQUESTER", nullable=False)
    created_at = Column(DateTime, default=get_utc_now)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    employee_name = Column(String(100), index=True)
    employee_email = Column(String(100), index=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    payment_mode = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    receipt_path = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")
    submitted_at = Column(DateTime, default=get_utc_now)


class Translation(Base):
    __tablename__ = "translations"

    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(String(1000), index=True, nullable=False)
    target_language = Column(String(10), index=True, nullable=False)
    translated_text = Column(String(1000), nullable=False)
