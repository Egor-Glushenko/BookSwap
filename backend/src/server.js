import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import booksRoutes from './routes/books.routes.js';
import chatsRoutes from './routes/chats.routes.js';
import moderationRoutes from './routes/moderation.routes.js';

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'bookswap-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/moderation', moderationRoutes);

app.listen(config.port, () => console.log(`BookSwap API listening on http://localhost:${config.port}`));
