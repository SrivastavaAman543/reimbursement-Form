from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import os
import uuid
import json
import requests
from database import engine, Base, get_db
import models, schemas, mailer
from datetime import datetime
from auth import hash_password, verify_password, create_access_token, get_current_user

# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Reimbursement API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
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

@app.post("/api/expenses", response_model=schemas.ExpenseRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_expense_request(
    data: str = Form(...), # JSON string of ExpenseRequestCreate
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        request_data = json.loads(data)
        request_items = request_data.get("items", [])
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid form data format")

    db_request = models.ExpenseRequest(
        user_id=current_user.id,
        employee_name=request_data.get("employee_name"),
        employee_email=request_data.get("employee_email"),
        request_type=request_data.get("request_type", "claim"),
        status="pending"
    )
    db.add(db_request)
    db.flush()

    for item in request_items:
        db_item = models.ExpenseItem(
            request_id=db_request.id,
            title=item.get("title"),
            description=item.get("description"),
            category=item.get("category"),
            date=datetime.strptime(item.get("date"), "%Y-%m-%d").date()
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_request)
    
    # Manual add items for response
    items = db.query(models.ExpenseItem).filter(models.ExpenseItem.request_id == db_request.id).all()
    db_request.items = items
    return db_request

@app.get("/api/expenses", response_model=List[schemas.ExpenseRequestResponse])
def get_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_role = current_user.user_role.strip().upper()
    
    query = db.query(models.ExpenseRequest)
    if user_role not in ["ADMIN", "MANAGER"]:
        query = query.filter(models.ExpenseRequest.user_id == current_user.id)
    
    requests = query.order_by(desc(models.ExpenseRequest.submitted_at)).all()
    
    # Manually attach items
    for req in requests:
        req.items = db.query(models.ExpenseItem).filter(models.ExpenseItem.request_id == req.id).all()
        
    return requests

@app.patch("/api/expenses/{request_id}", response_model=schemas.ExpenseRequestResponse)
def update_request_status(
    request_id: int, 
    update: schemas.ExpenseUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_role = current_user.user_role.strip().upper()
    db_request = db.query(models.ExpenseRequest).filter(models.ExpenseRequest.id == request_id).first()
    
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")

    # Step 2: Manager Approval
    if user_role == "MANAGER":
        if db_request.status != "pending":
            raise HTTPException(status_code=400, detail="Request is not in pending status")
        if update.status not in ["manager_approved", "rejected"]:
            raise HTTPException(status_code=400, detail="Manager can only set to 'manager_approved' or 'rejected'")
        
        # If Expense Approval, skip the Receipt Upload stage (manager_approved)
        # and go directly to Admin Review (pending_final_approval)
        if update.status == "manager_approved" and db_request.request_type == "expense_approval":
            db_request.status = "pending_final_approval"
        else:
            db_request.status = update.status

    # Step 4: Admin Approval
    elif user_role == "ADMIN":
        if db_request.status != "pending_final_approval" and db_request.status != "pending":
            # Admin can bypass and approve pending as well? Yes, user said "Admin has all access"
            pass
        if update.status not in ["approved", "rejected", "receipt_rejected"]:
            raise HTTPException(status_code=400, detail="Admin can only set to 'approved', 'rejected', or 'receipt_rejected'")
        db_request.status = update.status
        if update.rejection_comment:
            db_request.rejection_comment = update.rejection_comment
    
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.commit()
    db.refresh(db_request)
    db_request.items = db.query(models.ExpenseItem).filter(models.ExpenseItem.request_id == db_request.id).all()
    return db_request

@app.patch("/api/expenses/{request_id}/complete", response_model=schemas.ExpenseRequestResponse)
async def complete_expense_request(
    request_id: int,
    item_data: str = Form(...), # JSON string mapping item_id to {amount, payment_mode}
    receipts: List[UploadFile] = File(...), # Map file index to item index or similar? 
    # For simplicity, we'll assume files are ordered same as items in item_data list
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_request = db.query(models.ExpenseRequest).filter(
        models.ExpenseRequest.id == request_id, 
        models.ExpenseRequest.user_id == current_user.id
    ).first()

    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if db_request.status not in ["manager_approved", "receipt_rejected"]:
        raise HTTPException(status_code=400, detail="Request must be manager approved or receipt rejected before completion")

    try:
        completion_data = json.loads(item_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item data")

    # completion_data should be a list of {id, amount, payment_mode}
    total_amount = 0.0
    for i, data in enumerate(completion_data):
        item_id = data.get("id")
        db_item = db.query(models.ExpenseItem).filter(models.ExpenseItem.id == item_id).first()
        if not db_item: continue

        db_item.amount = data.get("amount")
        db_item.payment_mode = data.get("payment_mode")
        total_amount += db_item.amount

        # Handle Receipt
        if i < len(receipts):
            file = receipts[i]
            if file.content_type in ALLOWED_FILE_TYPES:
                file_content = await file.read()
                ext = file.filename.split(".")[-1]
                unique_filename = f"{uuid.uuid4()}.{ext}"
                file_path = os.path.join(UPLOAD_DIR, unique_filename)
                with open(file_path, "wb") as f:
                    f.write(file_content)
                db_item.receipt_path = file_path

    db_request.total_amount = total_amount
    db_request.status = "pending_final_approval"
    db.commit()
    db.refresh(db_request)
    db_request.items = db.query(models.ExpenseItem).filter(models.ExpenseItem.request_id == db_request.id).all()
    return db_request

# ==================== TRANSLATION ENDPOINTS ====================

@app.post("/api/translate", response_model=schemas.TranslateResponse)
def translate_texts(request: schemas.TranslateRequest, db: Session = Depends(get_db)):
    if request.target_language == 'en' or not request.texts:
        return {"translations": {t: t for t in request.texts}}

    target_lang = request.target_language
    unique_texts = list(set(request.texts))
    result = {}
    missing_texts = []

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

    if missing_texts:
        new_cached_entries = []
        for text in missing_texts:
            url = "https://translate.googleapis.com/translate_a/single"
            params = { "client": "gtx", "sl": "en", "tl": target_lang, "dt": "t", "q": text }
            try:
                response = requests.get(url, params=params, timeout=5)
                data = response.json()
                translated = "".join([sentence[0] for sentence in data[0] if sentence[0]])
                result[text] = translated
                new_cached_entries.append(models.Translation(source_text=text, target_language=target_lang, translated_text=translated))
            except Exception as e:
                result[text] = text
                
        if new_cached_entries:
            db.bulk_save_objects(new_cached_entries)
            db.commit()

    return {"translations": result}
