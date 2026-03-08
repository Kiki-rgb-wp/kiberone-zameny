/**
 * Middleware авторизации: проверка JWT от Supabase Auth.
 * Из токена извлекаются user_id (sub) и при необходимости role (из custom claims или profiles).
 * req.user = { id, email, role } — используется в контроллерах для проверки прав.
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы — авторизация будет мокаться в тестах');
}

const supabase = createClient(supabaseUrl || 'http://localhost', supabaseServiceKey || 'mock');

/**
 * Проверяет JWT из заголовка Authorization: Bearer <token>
 * и подставляет в req.user данные пользователя (id, email, role из profiles).
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Неверный или истёкший токен' });
    }

    // Роль берём из таблицы profiles (при логине или при первом запросе)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: (profile && profile.role) || 'tutor', // по умолчанию tutor, если нет профиля
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
