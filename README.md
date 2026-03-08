# Замены KIBERone

Мини-приложение для управления расписанием занятий преподавателей (аналог «Яндекс Смены»).

## Роли

- **Admin** — видит все расписания и заявки, управляет сменами.
- **Tutor** — преподаватель: своё расписание и заявки своей роли.
- **Assistant** — ассистент: своё расписание и заявки своей роли.

## Структура проекта

```
├── backend/          # API (Node.js + Express)
├── frontend/         # UI (статический/SPA)
├── supabase/
│   ├── migrations/  # SQL-миграции (таблицы + RLS)
│   └── functions/   # Edge Functions (уведомления)
├── tests/           # Unit и интеграционные тесты
└── .github/workflows/  # CI/CD
```

## Локальный запуск

**Пошаговая инструкция:** см. [docs/ЗАПУСК.md](docs/ЗАПУСК.md).

Кратко: создать проект в Supabase → применить миграции → создать пользователя и выдать роль admin → в `backend/.env` прописать SUPABASE_URL и ключи → запустить `backend` (npm run dev) и `frontend` (npm run dev) → открыть http://localhost:5173 и войти.

## Переменные окружения

См. `.env.example`. Для Railway задать: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, ключи для email (Resend: `RESEND_API_KEY`, `NOTIFY_EMAIL_ADMIN`).

## Назначение роли Admin

После регистрации пользователи получают роль `tutor` (триггер в БД). Админа задают вручную в Supabase:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
```
