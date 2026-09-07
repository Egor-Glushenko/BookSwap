# BookSwap MVP architecture

The repository is a workspace with two independently deployable applications:

- `frontend/` — React + Vite interface. Network access is isolated in `src/shared/api.js`.
- `backend/` — Express API. Routes only translate HTTP; business logic belongs in `src/services`; PostgreSQL access is isolated in `src/repositories` and `src/db`.

## Authentication

The current MVP supports only email/password registration and sign-in. Passwords are salted and hashed with Node.js `scrypt`; sessions are opaque tokens. No confirmation or one-time codes are used.

Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.

## Data evolution

Users are stored in PostgreSQL through `src/repositories/user.repository.js`; the database schema is versioned in `backend/migrations`. Session tokens remain in the in-memory MVP session store. Before multi-instance production deployment, move sessions to Redis; routes and the auth service can remain unchanged.
