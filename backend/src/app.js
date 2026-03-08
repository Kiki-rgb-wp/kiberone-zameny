/**
 * Express-приложение: маршруты и middleware.
 * Все защищённые роуты проверяют JWT от Supabase Auth.
 */
const express = require('express');
const cors = require('cors');

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const replacementsRoutes = require('./routes/replacements');
const responsesRoutes = require('./routes/responses');
const profilesRoutes = require('./routes/profiles');
const { errorHandler } = require('./middleware/error');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Публичный вход
app.use('/login', authRoutes);

// Текущий пользователь (id, email, role) — для UI после входа
app.get('/me', authMiddleware, (req, res) => res.json(req.user));

// Далее — только для авторизованных пользователей
app.use(authMiddleware);

app.use('/schedule', scheduleRoutes);
app.use('/profiles', profilesRoutes);
app.use('/replacements', replacementsRoutes);
app.use('/responses', responsesRoutes);

app.use(errorHandler);

module.exports = app;
