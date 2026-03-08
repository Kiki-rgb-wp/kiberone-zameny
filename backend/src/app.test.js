/**
 * Юнит-тесты API: проверка кодов ответов без внешних зависимостей.
 * Без токена защищённые роуты возвращают 401; POST /login без данных — 400.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

// Supabase клиенты требуют URL при загрузке модулей — задаём заглушки для тестов
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.x';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.y';

const app = require('./app');

describe('API', () => {
  let server;
  let baseUrl;

  before(() => {
    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const a = server.address();
        baseUrl = `http://localhost:${a.port}`;
        resolve();
      });
    });
  });

  after(() => new Promise((resolve) => server.close(resolve)));

  it('GET /schedule без токена возвращает 401', async () => {
    const res = await fetch(baseUrl + '/schedule');
    assert.strictEqual(res.status, 401);
  });

  it('GET /replacements без токена возвращает 401', async () => {
    const res = await fetch(baseUrl + '/replacements');
    assert.strictEqual(res.status, 401);
  });

  it('POST /responses без токена возвращает 401', async () => {
    const res = await fetch(baseUrl + '/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: 'x', can_cover: true }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('POST /login без email/password возвращает 400', async () => {
    const res = await fetch(baseUrl + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
  });

  it('POST /schedule без токена возвращает 401', async () => {
    const res = await fetch(baseUrl + '/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'u1', date: '2024-03-10' }),
    });
    assert.strictEqual(res.status, 401);
  });
});
