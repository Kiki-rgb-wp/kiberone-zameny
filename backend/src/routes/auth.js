/**
 * POST /login — авторизация через Supabase Auth.
 * POST /register — регистрация нового преподавателя (email, password, name).
 * Роль по умолчанию — tutor (создаётся в profiles триггером в БД).
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.post('/', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Укажите email и password' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
      expires_at: data.session.expires_at,
    });
  } catch (err) {
    next(err);
  }
});

// Регистрация: создаёт пользователя в Supabase Auth; триггер в БД добавит запись в profiles с role (тьютор/ассистент)
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Укажите email и пароль' });
    }
    const safeRole = role === 'assistant' ? 'assistant' : 'tutor';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '', role: safeRole },
      },
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Supabase может требовать подтверждение email — тогда data.session будет null
    if (data.session) {
      return res.json({
        message: 'Регистрация успешна',
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
      });
    }
    res.json({ message: 'Зарегистрированы. Подтвердите email, если включено, затем войдите.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
