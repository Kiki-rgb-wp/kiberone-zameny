/**
 * Уведомления админам: новая заявка, успешная замена, отказ с причиной.
 * Реализация через Resend/SendGrid или вызов Supabase Edge Function.
 * При вставке в replacement_requests/replacement_responses в БД можно вызывать Edge Function.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const NOTIFY_EMAIL_ADMIN = process.env.NOTIFY_EMAIL_ADMIN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendEmail(subject, text) {
  if (!NOTIFY_EMAIL_ADMIN) return;
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'replacements@kiberone.local',
          to: [NOTIFY_EMAIL_ADMIN],
          subject,
          text,
        }),
      });
      if (!res.ok) console.error('Resend error:', await res.text());
    } catch (e) {
      console.error('Notify send failed:', e);
    }
    return;
  }
  // Fallback: вызов Edge Function "notify" если есть
  if (SUPABASE_URL) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, text, to: NOTIFY_EMAIL_ADMIN }),
      });
    } catch (e) {
      console.error('Edge notify failed:', e);
    }
  }
}

async function notifyAdmins(event, payload) {
  let subject = 'Замены KIBERone';
  let text = '';
  switch (event) {
    case 'new_request':
      subject += ': Новая заявка на замену';
      text = `Новая заявка: ${payload.date} ${payload.time || ''} ${payload.location || ''}. Причина: ${payload.reason || '-'}`;
      break;
    case 'replacement_filled':
      subject += ': Замена выполнена';
      text = `Заявка ${payload.request_id} закрыта. Преподаватель ${payload.responder_id} взял смену ${payload.date} ${payload.time || ''} ${payload.location || ''}.`;
      break;
    case 'replacement_declined':
      subject += ': Отказ от замены (причина)';
      text = `Отказ по заявке ${payload.request_id}. Причина (только для админа): ${payload.reason || '-'}`;
      break;
    default:
      text = JSON.stringify(payload);
  }
  await sendEmail(subject, text);
}

module.exports = { notifyAdmins, sendEmail };
