from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
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


class ExpenseRequest(Base):
    __tablename__ = "expense_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    employee_name = Column(String(100), index=True)
    employee_email = Column(String(100), index=True)
    status = Column(String(50), default="pending")  # pending, manager_approved, pending_final_approval, approved, rejected
    request_type = Column(String(20), default="claim") # expense_approval, claim
    submitted_at = Column(DateTime, default=get_utc_now)
    total_amount = Column(Float, default=0.0)
    rejection_comment = Column(String(500), nullable=True)

class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, nullable=False)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=True)  # Filled in Stage 3 (Actual)
    approx_amount = Column(Float, nullable=True) # Filled in Stage 1
    payment_mode = Column(String(50), nullable=True)  # Filled in Stage 3
    date = Column(Date, nullable=False)
    receipt_path = Column(String(255), nullable=True)  # Filled in Stage 3


class Translation(Base):
    __tablename__ = "translations"

    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(String(500), index=True, nullable=False)
    target_language = Column(String(10), index=True, nullable=False)
    translated_text = Column(String(500), nullable=False)
