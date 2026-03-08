/**
 * Заявки на замену (replacement_requests).
 * GET /replacements — тюторы видят только заявки тюторов, ассистенты — только ассистентов; админ видит все.
 * POST /replacements — создание заявки; requester_id берётся из req.user.
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { notifyAdmins } = require('../services/notify');

const router = express.Router();

function getSupabase(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// GET /replacements — только заявки своей роли (тьюторы не видят заявки ассистов и наоборот)
router.get('/', async (req, res, next) => {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: list, error } = await supabaseAdmin
      .from('replacement_requests')
      .select('id, requester_id, date, time, location, reason, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!list || list.length === 0) return res.json([]);

    const isAdmin = req.user.role === 'admin';
    if (isAdmin) return res.json(list);

    const requesterIds = [...new Set(list.map((r) => r.requester_id))];
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .in('id', requesterIds);
    const roleById = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p.role }), {});

    const filtered = list.filter((r) => roleById[r.requester_id] === req.user.role);
    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

// POST /replacements — новая заявка (requester_id = текущий пользователь)
router.post('/', async (req, res, next) => {
  try {
    const supabase = getSupabase(req);
    const { date, time, location, reason } = req.body || {};

    if (!date) {
      return res.status(400).json({ error: 'Укажите дату' });
    }

    const row = {
      requester_id: req.user.id,
      date,
      time: time || null,
      location: location || null,
      reason: reason || null,
      status: 'open',
    };

    const { data, error } = await supabase.from('replacement_requests').insert(row).select().single();
    if (error) throw error;

    await notifyAdmins('new_request', {
      request_id: data.id,
      date: data.date,
      time: data.time,
      location: data.location,
      reason: data.reason,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
