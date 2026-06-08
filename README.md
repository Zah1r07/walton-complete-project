# Walton Warranty Portal

A full-stack warranty service portal for managing Walton product registrations, warranty claims, claim decisions, and customer feedback.

The project uses a Django REST API for the backend and a React/Vite single-page app for the frontend. It includes JWT authentication, role-based access control, demo data seeding, Docker support, and a persistent SQLite database volume for container runs.

## Features

- Customer login and self-service warranty dashboard
- Product registration with purchase date tracking
- Warranty claim submission and claim history
- Admin dashboard for customers, products, registrations, claims, and feedback
- Admin-only claim approval and rejection workflow
- Feedback collection with automatic sentiment scoring
- JWT-based authentication with admin and customer roles
- Docker Compose setup for backend, frontend, and persistent data
- Demo seed command for repeatable local testing

## Tech Stack

- Backend: Django, Django REST Framework, Simple JWT
- Frontend: React, Vite, Axios, React Router
- Database: SQLite
- Deployment/runtime: Docker, Docker Compose, Gunicorn, Nginx
- Sentiment analysis: VADER Sentiment

## Project Structure

```text
walton-full-project/
|-- backend/          # Django API, models, serializers, permissions, seed command
|-- frontend/         # React/Vite frontend application
|-- timesheets/       # Generated project timesheet files
|-- docker-compose.yml
`-- README.md
```

## Quick Start With Docker

From the project root:

```powershell
docker compose up -d --build
```

Open the app:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/`

Stop the containers:

```powershell
docker compose down
```

The Docker setup stores the SQLite database in the `backend_data` volume, so data remains available after restarting containers.

## Local Development

Run the backend and frontend in separate terminals.

### Backend

```powershell
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Backend API:

```text
http://localhost:8000/api/
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend dev server:

```text
http://localhost:5173
```

## Demo Accounts

Use these accounts after running `python manage.py seed_demo`.

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Customer | `amina.rahman` | `testpass123` |

## Main Workflows

Admin users can:

- Create customer accounts
- Add and manage products
- View all registrations
- Review warranty claims
- Approve or reject claims
- Review customer feedback and sentiment

Customer users can:

- Register purchased products
- Submit warranty claims
- Track claim status
- Submit feedback for claims

## API Notes

The frontend authenticates through JWT endpoints and stores the token locally for authenticated API requests.

Important API areas include:

- `auth/login/` for login
- `auth/me/` for the current user
- `users/` for user management
- `products/` for product records
- `registrations/` for registered products
- `claims/` for warranty claims
- `claims/<id>/update_status/` for admin claim decisions
- `feedback/` for customer feedback

## Environment Configuration

The Docker Compose file provides development defaults:

```text
SECRET_KEY=dev-secret-change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5173
SQLITE_PATH=/data/db.sqlite3
```

For production, update these values:

- Use a strong `SECRET_KEY`
- Set `DEBUG=False`
- Restrict `ALLOWED_HOSTS`
- Restrict `CORS_ALLOWED_ORIGINS`
- Restrict `CSRF_TRUSTED_ORIGINS`
- Use a production-ready database if the app needs to scale beyond a small deployment

## Timesheets

Generated timesheet documents are stored in `timesheets/`.

Current generated files:

- `timesheet_300_hours_bangladesh.html`
- `timesheet_300_hours_bangladesh.pdf`

## Useful Commands

Run migrations:

```powershell
cd backend
python manage.py migrate
```

Seed demo data:

```powershell
cd backend
python manage.py seed_demo
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Rebuild Docker containers:

```powershell
docker compose up -d --build
```
