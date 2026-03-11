# Как отправить проект на GitHub

Выполни в терминале **из папки проекта** (где лежит этот файл) по порядку.

## 1. Настроить Git (один раз)

Подставь свой email и имя (или оставь как есть для GitHub):

```bash
git config user.email "твой-email@example.com"
git config user.name "Kiki-rgb-wp"
```

Для GitHub можно использовать noreply-email:

```bash
git config user.email "Kiki-rgb-wp@users.noreply.github.com"
git config user.name "Kiki-rgb-wp"
```

## 2. Создать коммит

```bash
cd "/Users/user/Desktop/киьер заменв"
git add .
git commit -m "Первый коммит"
git branch -M main
```

## 3. Исправить адрес репозитория и отправить код

Сейчас в remote записан заглушка `ИМЯ_РЕПОЗИТОРИЯ`. Замени **НАЗВАНИЕ_РЕПО** на настоящее имя репозитория, которое ты создал на GitHub (например `kiberone-zameny`):

```bash
git remote remove origin
git remote add origin https://github.com/Kiki-rgb-wp/НАЗВАНИЕ_РЕПО.git
git push -u origin main
```

Пример, если репо называется `kiberone-zameny`:

```bash
git remote remove origin
git remote add origin https://github.com/Kiki-rgb-wp/kiberone-zameny.git
git push -u origin main
```

Если GitHub попросит авторизацию — используй **Personal Access Token** вместо пароля (GitHub → Settings → Developer settings → Personal access tokens → Generate new token).

---

## Если пуш отклонили из‑за «repository rule violations» / secret scanning

В коммите не должно быть реальных ключей. В `.env.example` должны быть только **плейсхолдеры** (как в шаблоне выше), не подставляй туда настоящие ключи.

После того как убрал секреты из `.env.example`, перезаписать последний коммит и отправить снова:

```bash
git add .env.example
git commit --amend --no-edit
git push -u origin main
```

**Важно:** если реальные ключи Supabase уже попадали в репозиторий (или в скриншот), в Supabase Dashboard смени их: **Project Settings → API → Regenerate** anon key и service_role key, затем пропиши новые значения в `backend/.env` локально (файл `.env` в репо не коммитится).
