from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List

# --- Expense Item Schemas ---

class ExpenseItemBase(BaseModel):
    title: str
    description: str
    category: str
    date: date
    approx_amount: Optional[float] = 0.0

class ExpenseItemCreate(ExpenseItemBase):
    pass

class ExpenseItemComplete(BaseModel):
    item_id: int
    amount: float = Field(gt=0)
    payment_mode: str
    # receipt_path is handled via multipart in Stage 3

class ExpenseItemResponse(ExpenseItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: Optional[float] = None
    payment_mode: Optional[str] = None
    receipt_path: Optional[str] = None
    approx_amount: Optional[float] = 0.0

# --- Expense Request Schemas ---

class ExpenseRequestBase(BaseModel):
    employee_name: str
    employee_email: str

class ExpenseRequestCreate(ExpenseRequestBase):
    request_type: str = "claim"
    items: List[ExpenseItemCreate]

class ExpenseRequestResponse(ExpenseRequestBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    status: str
    request_type: str = "claim"
    submitted_at: datetime
    total_amount: float
    rejection_comment: Optional[str] = None
    items: List[ExpenseItemResponse]

class ExpenseUpdate(BaseModel):
    status: str
    rejection_comment: Optional[str] = None

# --- User Schemas ---

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

# --- Translation Schemas ---

class TranslateRequest(BaseModel):
    texts: List[str]
    target_language: str

class TranslateResponse(BaseModel):
    translations: dict[str, str]
