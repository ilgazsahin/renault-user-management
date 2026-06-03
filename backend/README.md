# User Management — Backend (NestJS)

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

1. Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

2. Create the database:

```sql
CREATE DATABASE usermgmt;
```

3. Install dependencies:

```bash
npm install
```

4. Start in development mode:

```bash
npm run start:dev
```

The API runs at `http://localhost:3000`.

## Default credentials

On first startup a seed admin is created automatically:

| Field    | Value              |
|----------|--------------------|
| Username | `admin`            |
| Password | `admin123`         |
| Role     | `admin`            |

## Environment variables

| Variable      | Default                                      | Description              |
|---------------|----------------------------------------------|--------------------------|
| DB_HOST       | localhost                                    | PostgreSQL host          |
| DB_PORT       | 5432                                         | PostgreSQL port          |
| DB_USERNAME   | postgres                                     | PostgreSQL user          |
| DB_PASSWORD   | postgres                                     | PostgreSQL password      |
| DB_DATABASE   | usermgmt                                     | Database name            |
| JWT_SECRET    | your-super-secret-key-change-in-production   | JWT signing secret       |
| JWT_EXPIRES_IN| 8h                                           | JWT expiry               |
| PORT          | 3000                                         | HTTP port                |

## API endpoints

| Method | Path           | Roles        | Description          |
|--------|----------------|--------------|----------------------|
| POST   | /auth/login    | Public       | Returns access_token |
| GET    | /users         | Admin, User  | List all users       |
| GET    | /users/:id     | Admin, User  | Get user by id       |
| POST   | /users         | Admin only   | Create user          |
| PATCH  | /users/:id     | Admin only   | Update user          |
| DELETE | /users/:id     | Admin only   | Delete user          |
