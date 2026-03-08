/**
 * Расписание (schedule).
 * GET /schedule — текущий пользователь или все смены (для админа). Права: RLS в Supabase + здесь не отдаём чужие данные при role !== admin.
 * POST /schedule — создание/обновление смены только для админа.
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

function getSupabase(req) {
  // Для запросов от имени пользователя используем его JWT, чтобы RLS применялся
  const token = req.headers.authorization?.replace('Bearer ', '');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// GET /schedule — только своё расписание (для всех ролей). Каждый видит только свои смены.
router.get('/', async (req, res, next) => {
  try {
    const supabase = getSupabase(req);
    const { data, error } = await supabase
      .from('schedule')
      .select('id, user_id, date, time, location, subject, created_at')
      .eq('user_id', req.user.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    next(err);
  }
});

// POST /schedule — только админ: создание или обновление смены
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { user_id, date, time, location, subject, id } = req.body || {};

    if (!user_id || !date) {
      return res.status(400).json({ error: 'Нужны user_id и date' });
    }

    const row = {
      user_id,
      date,
      time: time || null,
      location: location || null,
      subject: subject || null,
    };

    if (id) {
      const { data, error } = await supabaseAdmin.from('schedule').update(row).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    const { data, error } = await supabaseAdmin.from('schedule').insert(row).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// POST /schedule/generate-month — только админ: скопировать расписание с предыдущего месяца на указанный
// Тело: { year, month } — целевой месяц (1–12). Берутся смены из (year, month-1) и дублируются с теми же днями.
router.post('/generate-month', adminOnly, async (req, res, next) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    let { year, month } = req.body || {};
    year = parseInt(year, 10);
    month = parseInt(month, 10);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Укажите year и month (1–12)' });
    }

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const fromStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const fromEnd = new Date(prevYear, prevMonth, 0);
    const fromEndStr = fromEnd.toISOString().slice(0, 10);

    const { data: sourceRows, error: fetchErr } = await supabase
      .from('schedule')
      .select('id, user_id, date, time, location, subject')
      .gte('date', fromStart)
      .lte('date', fromEndStr);

    if (fetchErr) throw fetchErr;
    if (!sourceRows || sourceRows.length === 0) {
      return res.json({ message: 'Нет смен в предыдущем месяце', added: 0 });
    }

    const daysInTarget = new Date(year, month, 0).getDate();
    const toInsert = [];
    for (const row of sourceRows) {
      const sourceDay = parseInt(String(row.date).slice(8, 10), 10);
      if (sourceDay > daysInTarget) continue;
      const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(sourceDay).padStart(2, '0')}`;
      toInsert.push({
        user_id: row.user_id,
        date: targetDate,
        time: row.time,
        location: row.location,
        subject: row.subject,
      });
    }

    if (toInsert.length === 0) {
      return res.json({ message: 'Нет смен для копирования в целевой месяц', added: 0 });
    }

    const { data: inserted, error: insertErr } = await supabase.from('schedule').insert(toInsert).select('id');
    if (insertErr) throw insertErr;

    res.json({ message: `Добавлено смен: ${inserted.length}`, added: inserted.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
