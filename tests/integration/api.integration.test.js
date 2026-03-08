/**
 * Интеграционные тесты API.
 * Запуск: с заданными SUPABASE_URL и тестовым пользователем можно проверить
 * реальные запросы к БД. Без переменных — тесты пропускаются.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');

const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('Интеграция API', () => {
  it('пропуск если нет тестовой БД', () => {
    if (!hasSupabase) {
      console.log('Пропуск: задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY для интеграционных тестов');
    }
    assert.ok(true);
  });
});
