/**
 * GET /profiles — список преподавателей (только для админа).
 * Нужен для выбора пользователя при добавлении смены.
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

router.get('/', adminOnly, async (req, res, next) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .order('email');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
