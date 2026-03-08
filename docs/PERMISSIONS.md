# Проверка прав и безопасность

## Роли

- **admin** — видит все расписания и заявки, может создавать/обновлять смены (POST /schedule).
- **tutor** / **assistant** — видят только своё расписание и заявки (свои + открытые для отклика).

## Где проверяются права

### Backend (API)

- **authMiddleware** — все роуты кроме `/login`: проверка JWT, подстановка `req.user` (id, email, role из `profiles`).
- **adminOnly** — на `POST /schedule`: только `role === 'admin'`.
- **GET /schedule** — если не админ, явно фильтр `user_id = req.user.id`; иначе RLS в БД тоже ограничивает по `auth.uid()`.
- **GET /replacements** — запрос от имени пользователя (JWT в заголовке), поэтому Supabase RLS возвращает только разрешённые строки.
- **POST /replacements** — `requester_id` задаётся сервером из `req.user.id`, подмена невозможна.
- **POST /responses** — отклик от своего имени; проверка, что заявка открыта и не своя.

### База данных (RLS)

- **profiles**: чтение — свой профиль или админ видит все.
- **schedule**: чтение — только свои смены (`user_id = auth.uid()`) или админ; изменение — только админ (и через service role в API).
- **replacement_requests**: чтение — свои заявки, все открытые (для отклика), админ — все; вставка — только со своим `requester_id`.
- **replacement_responses**: чтение — свой отклик или админ (причины отказов видны только админу); вставка — только со своим `responder_id`.

## Отказы («Не могу»)

Поле `reason` в `replacement_responses` при `can_cover = false` доступно только админу за счёт RLS (политики `replacement_responses_select_own` и `replacement_responses_select_admin`). Обычный преподаватель не видит чужие причины отказа.
