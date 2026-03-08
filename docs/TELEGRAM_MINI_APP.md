# Запуск «Замены KIBERone» как Telegram Mini App

Mini App — это ваша веб-страница, открытая внутри Telegram. Нужно выложить фронт и API в интернет и привязать ссылку к боту.

---

## 1. Деплой бэкенда (API)

Подойдёт **Railway**, **Render**, **Fly.io** и т.п.

**Пример: Railway**

1. Залейте репозиторий на GitHub.
2. В [railway.app](https://railway.app) создайте проект → **Deploy from GitHub** → выберите репозиторий, корень или папка `backend`.
3. В настройках сервиса укажите:
   - **Root Directory:** `backend` (если проект в корне репо).
   - **Start Command:** `node src/index.js` или `npm start`.
4. В **Variables** задайте:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - при необходимости `RESEND_API_KEY`, `NOTIFY_EMAIL_ADMIN`
5. Деплой → в настройках включите **Generate Domain**. Скопируйте URL, например:  
   `https://your-app.up.railway.app`

---

## 2. Деплой фронтенда

Нужен **HTTPS**-хостинг (обязательно для Mini App): **Vercel**, **Netlify**, **Cloudflare Pages**.

**Пример: Vercel**

1. В корне проекта (или в папке `frontend`) создайте/проверьте сборку:
   - из корня: `cd frontend && npm run build` → выход в `frontend/dist`.
2. В [vercel.com](https://vercel.com): **Add New Project** → импорт из GitHub → выберите репозиторий.
3. **Root Directory:** `frontend`.
4. **Build Command:** `npm run build`.
5. **Output Directory:** `dist`.
6. **Environment Variables** — добавьте переменную для API:
   - имя: `VITE_API_URL`
   - значение: `https://your-app.up.railway.app` (ваш URL бэкенда из шага 1).
7. Деплой → получите URL фронта, например:  
   `https://zameny-kiberone.vercel.app`

Убедитесь, что в коде фронта запросы идут на `import.meta.env.VITE_API_URL` (или аналог), а не на относительный `/api`, когда приложение открыто в Telegram.

---

## 3. Сборка фронта с URL API

В коде фронта используется переменная **`VITE_API_URL`**: при сборке подставляется URL бэкенда (без `/api` в пути — запросы идут сразу на `/login`, `/schedule` и т.д.).

- **Локально:** можно не задавать — тогда запросы идут на `/api` (прокси Vite на localhost:3000).
- **Vercel/Netlify:** в настройках проекта добавьте переменную окружения **`VITE_API_URL`** = `https://ваш-бэкенд.up.railway.app` (без слэша в конце), затем пересоберите проект.

---

## 4. Создание бота и привязка Mini App

1. В Telegram откройте **@BotFather**.
2. Отправьте `/newbot`, придумайте имя и username (например `KIBERoneZamenyBot`).
3. Сохраните выданный **токен бота** (для возможных вебхуков и т.д.).
4. Отправьте `/newapp` или выберите бота и **Bot Settings** → **Menu Button** → **Configure menu button** (или **Configure Web App**).
5. Укажите:
   - **Menu button URL:** ваш URL фронтенда, например  
     `https://zameny-kiberone.vercel.app`
   - При запросе **Web App URL** — тот же URL.

После этого у бота в меню (кнопка слева от поля ввода) откроется ваше приложение как Mini App.

**Альтернатива:** можно не трогать Menu Button, а отдавать пользователю ссылку вида  
`https://t.me/KIBERoneZamenyBot/app`  
(если вы создали Mini App через BotFather как Web App с short name `app`). Тогда приложение откроется по этой ссылке.

---

## 5. CORS

Запросы в Mini App идут с origin вашего фронта (например `https://zameny-kiberone.vercel.app`). На бэкенде уже стоит `cors({ origin: true })`, поэтому любой origin допускается. Для продакшена можно ограничить:

```js
cors({ origin: ['https://zameny-kiberone.vercel.app', 'https://web.telegram.org'] })
```

Подставьте свой домен фронта.

---

## 6. Проверка

1. Откройте бота в Telegram.
2. Нажмите кнопку меню (или перейдите по ссылке Mini App).
3. Должна открыться ваша форма входа; после входа — расписание и заявки. Все запросы должны уходить на ваш API (проверьте во вкладке Network в DevTools, если откроете приложение в браузере по тому же URL).

---

## Краткий чеклист

| Шаг | Действие |
|-----|-----------|
| 1 | Деплой бэкенда (Railway и т.п.), получить HTTPS URL API |
| 2 | В фронте задать этот URL через `VITE_API_URL` и собрать проект |
| 3 | Деплой фронта на Vercel/Netlify, получить HTTPS URL |
| 4 | В BotFather создать бота и указать URL фронта как Mini App / Menu Button |
| 5 | Открыть бота в Telegram и запустить приложение из меню или по ссылке |

После этого приложение будет запускаться в Telegram как мини-приложение.
