from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import os
import uuid
import requests
from database import engine, Base, get_db
import models, schemas, mailer
from datetime import datetime
from auth import hash_password, verify_password, create_access_token, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Reimbursement API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ==================== EXPENSE ENDPOINTS ====================

@app.post("/api/expenses", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    employee_name: str = Form(...),
    employee_email: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    amount: float = Form(...),
    category: str = Form(...),
    payment_mode: str = Form(...),
    date: str = Form(...), 
    receipt: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    if receipt.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed. Must be JPG, PNG, or PDF.")
        
    file_content = await receipt.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 2MB limit.")
        
    ext = receipt.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)

    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    db_expense = models.Expense(
        user_id=current_user.id,
        employee_name=employee_name,
        employee_email=employee_email,
        title=title,
        description=description,
        amount=amount,
        category=category,
        payment_mode=payment_mode,
        date=parsed_date,
        receipt_path=file_path
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    if background_tasks:
        expense_data = {
            "title": db_expense.title,
            "description": db_expense.description,
            "employee_name": db_expense.employee_name,
            "employee_email": db_expense.employee_email,
            "category": db_expense.category,
            "date": db_expense.date,
            "amount": db_expense.amount,
            "payment_mode": db_expense.payment_mode,
            "receipt_path": db_expense.receipt_path,
            "status": db_expense.status
        }
        background_tasks.add_task(mailer.send_notification_from_dict, expense_data)
    
    return db_expense

@app.get("/api/expenses", response_model=List[schemas.ExpenseResponse])
def get_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.user_role.strip().upper() == "ADMIN":
        return db.query(models.Expense).order_by(desc(models.Expense.submitted_at)).all()
    
    return db.query(models.Expense).filter(models.Expense.user_id == current_user.id).order_by(desc(models.Expense.submitted_at)).all()

@app.patch("/api/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
async def update_expense_status(
    expense_id: int, 
    expense_update: schemas.ExpenseUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    if current_user.user_role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to update expense status")
        
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    if expense_update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'approved' or 'rejected'.")
        
    db_expense.status = expense_update.status
    db.commit()
    db.refresh(db_expense)
    
    if background_tasks:
        # Convert to dict to avoid DetachedInstanceError in background task
        expense_data = {
            "title": db_expense.title,
            "description": db_expense.description,
            "employee_name": db_expense.employee_name,
            "employee_email": db_expense.employee_email,
            "category": db_expense.category,
            "date": db_expense.date,
            "amount": db_expense.amount,
            "payment_mode": db_expense.payment_mode,
            "receipt_path": db_expense.receipt_path,
            "status": db_expense.status
        }
        background_tasks.add_task(mailer.send_notification_from_dict, expense_data)
    
    return db_expense

# ==================== TRANSLATION ENDPOINTS ====================

@app.post("/api/translate", response_model=schemas.TranslateResponse)
def translate_texts(request: schemas.TranslateRequest, db: Session = Depends(get_db)):
    if request.target_language == 'en' or not request.texts:
        # English is base language, return as is
        return {"translations": {t: t for t in request.texts}}

    target_lang = request.target_language
    unique_texts = list(set(request.texts))
    result = {}
    missing_texts = []

    # 1. Check database cache
    cached_translations = db.query(models.Translation).filter(
        models.Translation.target_language == target_lang,
        models.Translation.source_text.in_(unique_texts)
    ).all()

    cached_map = {ct.source_text: ct.translated_text for ct in cached_translations}
    
    for text in unique_texts:
        if text in cached_map:
            result[text] = cached_map[text]
        else:
            missing_texts.append(text)

    # 2. Call Free Google Translate API for missing texts
    if missing_texts:
        new_cached_entries = []
        for text in missing_texts:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                "client": "gtx",
                "sl": "en",
                "tl": target_lang,
                "dt": "t",
                "q": text
            }
            try:
                response = requests.get(url, params=params, timeout=5)
                data = response.json()
                
                # data[0] contains a list of translated segments (if the text has multiple sentences)
                translated = "".join([sentence[0] for sentence in data[0] if sentence[0]])
                
                result[text] = translated
                new_cached_entries.append(
                    models.Translation(
                        source_text=text,
                        target_language=target_lang,
                        translated_text=translated
                    )
                )
            except Exception as e:
                print(f"Translation Error for '{text}':", str(e))
                result[text] = text  # Fallback to original text on error
                
        if new_cached_entries:
            # Store newly translated texts in DB
            db.bulk_save_objects(new_cached_entries)
            db.commit()

    return {"translations": result}

