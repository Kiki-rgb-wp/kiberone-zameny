/**
 * Отклики на заявки (replacement_responses).
 * POST /responses — отклик: request_id, can_cover, reason.
 * Если can_cover=true: атомарно переносим смену с заявителя на откликнувшегося, status='filled', уведомление админам.
 * Если can_cover=false: сохраняем reason (видна только админу по RLS), уведомление админам.
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { processReplacementResponse } = require('../services/replacementService');

const router = express.Router();

const supabaseAdmin = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// POST /responses — откликнуться на заявку
router.post('/', async (req, res, next) => {
  try {
    const { request_id, can_cover, reason } = req.body || {};
    if (!request_id || typeof can_cover !== 'boolean') {
      return res.status(400).json({ error: 'Нужны request_id и can_cover (boolean)' });
    }

    const responderId = req.user.id;
    const supabase = supabaseAdmin();

    // Проверяем, что заявка существует и открыта
    const { data: request, error: reqError } = await supabase
      .from('replacement_requests')
      .select('id, requester_id, date, time, location, status')
      .eq('id', request_id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    if (request.status !== 'open') {
      return res.status(400).json({ error: 'Заявка уже закрыта' });
    }

    // Нельзя откликаться на свою заявку
    if (request.requester_id === responderId) {
      return res.status(400).json({ error: 'Нельзя откликаться на свою заявку' });
    }

    // Сохраняем отклик (reason при can_cover=false видна только админу — RLS в БД)
    const { data: responseRow, error: insertErr } = await supabase
      .from('replacement_responses')
      .insert({
        request_id,
        responder_id: responderId,
        can_cover,
        reason: reason || null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    if (can_cover) {
      // Атомарно: убрать смену у requester, добавить responder, status = filled, уведомления
      await processReplacementResponse(supabase, request, responderId, request_id);
    } else {
      const { notifyAdmins } = require('../services/notify');
      await notifyAdmins('replacement_declined', { request_id, reason });
    }

    res.status(201).json({
      message: can_cover ? 'Замена выполнена' : 'Отклик сохранён',
      response: responseRow,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
