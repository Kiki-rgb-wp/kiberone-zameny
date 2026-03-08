/**
 * Бизнес-логика при ответе "Могу" на заявку:
 * 1. Найти смену заявителя (requester) на эту дату/время/локацию (или первую подходящую).
 * 2. Обновить user_id этой смены на responder (преподаватель, который закрывает замену).
 * 3. Обновить replacement_requests.status = 'filled'.
 * 4. Уведомление админам — через вызов Edge Function или внешний API (здесь вызываем notify).
 */
const { notifyAdmins } = require('./notify');

/**
 * @param {object} supabase - клиент с service role
 * @param {object} request - строка replacement_requests (requester_id, date, time, location)
 * @param {string} responderId - id пользователя, который закрывает замену
 * @param {string} requestId - id заявки
 */
async function processReplacementResponse(supabase, request, responderId, requestId) {
  // Ищем смену заявителя в указанную дату
  const { data: scheduleRows } = await supabase
    .from('schedule')
    .select('id')
    .eq('user_id', request.requester_id)
    .eq('date', request.date)
    .limit(1);

  const scheduleId = scheduleRows && scheduleRows[0]?.id;

  if (scheduleId) {
    // Переносим смену с заявителя на того, кто взял замену
    await supabase.from('schedule').update({ user_id: responderId }).eq('id', scheduleId);
  } else {
    // Смены у заявителя не было — добавляем новую смену в расписание того, кто взял замену
    await supabase.from('schedule').insert({
      user_id: responderId,
      date: request.date,
      time: request.time || null,
      location: request.location || null,
      subject: null,
    });
  }

  await supabase
    .from('replacement_requests')
    .update({ status: 'filled' })
    .eq('id', requestId);

  await notifyAdmins('replacement_filled', {
    request_id: requestId,
    responder_id: responderId,
    date: request.date,
    time: request.time,
    location: request.location,
  });
}

module.exports = { processReplacementResponse };
