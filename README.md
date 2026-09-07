# BookSwap

React/Vite frontend and Node.js/Express backend for the BookSwap marketplace MVP.

## Run locally

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

The current UI uses local demo listings so every required flow can be previewed without a database. The Express API already exposes the MVP routes for listings, auth, ratings, favorites, chats, messages, and best books; PostgreSQL, Redis, and Socket.IO can be connected behind these routes next.
