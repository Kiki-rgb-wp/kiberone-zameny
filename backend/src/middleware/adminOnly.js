/**
 * Проверка роли Admin. Используется для роутов, доступных только админу
 * (например POST /schedule — создание/обновление смены).
 */
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Доступ только для администратора' });
}

module.exports = adminOnly;
