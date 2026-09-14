# BookSwap MVP architecture

The repository is a workspace with two independently deployable applications:

- `frontend/` — React + Vite interface. Network access is isolated in `src/shared/api.js`.
- `backend/` — Express API. Routes only translate HTTP; business logic belongs in `src/services`; PostgreSQL access is isolated in `src/repositories` and `src/db`.

## Authentication

The current MVP supports only login/password sign-in. Regular users register and sign in with email/password. Admin and moderator sessions are created only from the special configured credential pairs; ordinary database credentials are refused for staff roles. Passwords are salted and hashed with Node.js `scrypt`; authenticated API calls use signed JWT bearer tokens. No confirmation or one-time codes are used.

Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.

## Data evolution

Users, listings, ratings, favorites, chats, moderation records, categories, and reviews are stored in PostgreSQL through repository modules; the database schema is versioned in `backend/migrations`.
