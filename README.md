# User Management Portal

A full-stack user management application built with NestJS and Angular, containerized with Docker.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, TypeORM, PostgreSQL |
| Frontend | Angular 21, Nginx |
| Auth | JWT |
| Infrastructure | Docker Compose |

## Features

- JWT authentication (8h expiry)
- User CRUD with role-based access (admin / user)
- Password reset via email
- Audit log for all actions

## Getting Started

**Prerequisite:** Docker Desktop installed and running.

```bash
docker compose up
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5433 |

A default admin user is seeded automatically on first startup:

| Field    | Value               |
|----------|---------------------|
| Username | `admin`             |
| Email    | `admin@example.com` |
| Password | `admin123`          |
| Role     | `admin`             |

## Environment Variables

Create `backend/.env` before running. Key variables:

```env
JWT_SECRET=        # change in production
MAIL_USER=         # Gmail address for password reset emails
MAIL_PASSWORD=     # Gmail app password
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=usermgmt
```

> Never commit `.env` to version control.

## Project Structure

```
renault_case/
├── backend/       # NestJS API (auth, users, audit, mail)
├── frontend/      # Angular SPA
└── docker-compose.yml
```
