from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional

class ExpenseBase(BaseModel):
    employee_name: str
    employee_email: str
    title: str
    description: str
    amount: float = Field(gt=0, description="Amount must be greater than 0")
    category: str
    payment_mode: str

class ExpenseCreate(ExpenseBase):
    date: date

class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    title: str
    description: str
    amount: float
    category: str
    payment_mode: str
    date: date
    receipt_path: Optional[str] = None
    status: str
    submitted_at: datetime

class ExpenseUpdate(BaseModel):
    status: str


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    user_role: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TranslateRequest(BaseModel):
    texts: list[str]
    target_language: str


class TranslateResponse(BaseModel):
    translations: dict[str, str]
