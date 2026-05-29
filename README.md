# Walton Warranty Portal

Full-stack warranty service portal with a Django REST backend, JWT authentication, role-based access control, and a React/Vite frontend.

## Features

- Admin dashboard for customers, products, claims, and feedback
- Customer dashboard for product registration, warranty claims, and feedback
- JWT login with admin/customer roles
- Docker setup for backend, frontend, and persistent SQLite data
- Demo seed command for repeatable test accounts and sample records

## Local development

Backend:
```powershell
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Frontend:
```powershell
cd frontend
npm install
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/

## Docker

```powershell
docker compose up -d --build
```

Open:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api/

Stop containers:
```powershell
docker compose down
```

## Demo accounts

- Admin: `admin` / `admin123`
- Customer: `amina.rahman` / `testpass123`

## Environment

For production, provide a strong `SECRET_KEY`, set `DEBUG=False`, and restrict `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
