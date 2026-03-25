# 💸 Oges Finance & Reimbursement Dashboard

A professional, SaaS-grade enterprise reimbursement management system. Features a high-performance **FastAPI** backend, a responsive **React/Vite** frontend with dynamic dark/light themes, and automated **Gmail SMTP** notifications.

---

## ⚡ Features
- **Smart Global Filtering**: Role-based access with intuitive inline filters.
- **Enterprise-Grade Tables**: Beautiful, searchable request lists with receipt viewing.
- **Real-Time Analytics**: Interactive charts for spending by category and status using Recharts.
- **Automated Notifications**: Instant, professional HTMl emails triggered to your inbox via Gmail.
- **Bi-Lingual Support**: Seamless English and Hindi translations with persistent caching.
- **Persistent Auth**: 100-year session tokens and secure JWT-based role management (ADMIN vs. REQUESTER).

---

## 🛠️ Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **MySQL Server** (Ensure a database named `reimbursement` exists)

---

## 🚀 Getting Started

### 1. Backend Setup
Navigate to the backend folder and prepare the environment:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

#### Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/reimbursement
SECRET_KEY=paste_your_long_secure_random_string_here
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
```

#### Run Backend Server:
```bash
uvicorn main:app --reload
```
- API will be live at: `http://localhost:8000`
- API Documentation (Swagger Docs): `http://localhost:8000/docs`

---

### 2. Frontend Setup
Navigate to the frontend folder and install dependencies:
```bash
cd frontend
npm install
```

#### Run Frontend Development Server:
```bash
npm run dev
```
- Dashboad will be live at: `http://localhost:5173`

---

## 📂 Project Structure
```text
├── backend/
│   ├── main.py          # FastAPI application entry
│   ├── models.py        # SQLAlchemy database schemas
│   ├── mailer.py        # Professional HTML email logic
│   ├── auth.py          # JWT/Role-Based authentication
│   └── uploads/         # Local storage for receipts
├── frontend/
│   ├── src/
│   │   ├── pages/       # Dashboard and Request views
│   │   └── components/  # Forms and UI elements
│   └── public/          # Brand assets and logos
└── .gitignore           # Root security and cleanup rules
```

---

## 🤝 Contribution & License
Designed and Developed for Professional Enterprise Use.

**© 2026 Oges Asset Management Solutions**
