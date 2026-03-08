/**
 * Точка входа UI «Замены KIBERone».
 * В dev: /api (прокси на бэкенд). В продакшене (Telegram Mini App): VITE_API_URL.
 */
const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '/api';

let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');

const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const userInfoEl = document.getElementById('user-info');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginCard = loginScreen.querySelector('.card');
const registerCard = document.getElementById('register-card');
const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const scheduleList = document.getElementById('schedule-list');
const scheduleCalendar = document.getElementById('schedule-calendar');
const replacementsList = document.getElementById('replacements-list');
const btnNewRequest = document.getElementById('btn-new-request');
const dialogRequest = document.getElementById('dialog-request');
const formRequest = document.getElementById('form-request');
const requestRequesterName = document.getElementById('request-requester-name');
const cancelRequest = document.getElementById('cancel-request');
const dialogResponse = document.getElementById('dialog-response');
const formResponse = document.getElementById('form-response');
const responseRequestInfo = document.getElementById('response-request-info');
const responseDeclineReason = document.getElementById('response-decline-reason');
const cancelResponse = document.getElementById('cancel-response');
const adminAddShiftSection = document.getElementById('admin-add-shift');
const btnAddShift = document.getElementById('btn-add-shift');
const dialogAddShift = document.getElementById('dialog-add-shift');
const formAddShift = document.getElementById('form-add-shift');
const cancelAddShift = document.getElementById('cancel-add-shift');
const btnGenerateMonth = document.getElementById('btn-generate-month');
const genYearInput = document.getElementById('gen-year');
const genMonthInput = document.getElementById('gen-month');

function showScreen(isLoggedIn) {
  loginScreen.classList.toggle('hidden', isLoggedIn);
  mainScreen.classList.toggle('hidden', !isLoggedIn);
  if (isLoggedIn) {
    userInfoEl.textContent = user ? `${user.email} (${user.role || 'tutor'})` : '';
    adminAddShiftSection.classList.toggle('hidden', user?.role !== 'admin');
    loadSchedule();
    loadReplacements();
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ——— Переключение вход / регистрация ———
function showLoginCard() {
  if (loginCard) loginCard.classList.remove('hidden');
  if (registerCard) registerCard.classList.add('hidden');
}
function showRegisterCard() {
  if (loginCard) loginCard.classList.add('hidden');
  if (registerCard) registerCard.classList.remove('hidden');
}
showRegisterBtn.addEventListener('click', showRegisterCard);
showLoginBtn.addEventListener('click', showLoginCard);

// ——— Регистрация ———
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.classList.add('hidden');
  const fd = new FormData(registerForm);
  try {
    const res = await fetch(`${API}/login/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fd.get('email'),
        password: fd.get('password'),
        name: fd.get('name').trim() || '',
        role: fd.get('role') || 'tutor',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      registerError.textContent = data.error || 'Ошибка регистрации';
      registerError.classList.remove('hidden');
      return;
    }
    if (data.access_token) {
      token = data.access_token;
      user = { id: data.user?.id, email: data.user?.email };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      const meRes = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) {
        const me = await meRes.json();
        user.role = me.role;
        localStorage.setItem('user', JSON.stringify(user));
      }
      showScreen(true);
      showToast('Добро пожаловать!');
    } else {
      showToast(data.message || 'Регистрация успешна. Войдите.');
      showLoginCard();
    }
  } catch (err) {
    registerError.textContent = 'Нет связи с сервером';
    registerError.classList.remove('hidden');
  }
});

// ——— Вход ———
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const fd = new FormData(loginForm);
  const email = fd.get('email');
  const password = fd.get('password');
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      loginError.textContent = data.error || 'Ошибка входа';
      loginError.classList.remove('hidden');
      return;
    }
    token = data.access_token;
    user = { id: data.user?.id, email: data.user?.email };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    const meRes = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (meRes.ok) {
      const me = await meRes.json();
      user.role = me.role;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showScreen(true);
  } catch (err) {
    loginError.textContent = 'Нет связи с сервером';
    loginError.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showScreen(false);
});

// ——— Расписание ———
async function loadSchedule() {
  try {
    const res = await fetch(`${API}/schedule`, { headers: apiHeaders() });
    const list = await res.json().catch(() => []);
    if (!res.ok) {
      scheduleList.innerHTML = '<li>Ошибка загрузки расписания</li>';
      scheduleCalendar.innerHTML = '';
      return;
    }
    const rows = Array.isArray(list) ? list : [];
    renderScheduleList(rows);
    renderCalendar(rows);
  } catch (err) {
    scheduleList.innerHTML = '<li>Ошибка загрузки расписания</li>';
    scheduleCalendar.innerHTML = '';
  }
}

function renderScheduleList(list) {
  scheduleList.innerHTML = list.length
    ? list.map((s) => `<li>${s.date} ${s.time || ''} — ${s.location || '-'} ${s.subject || ''}</li>`).join('')
    : '<li>Нет смен</li>';
}

function renderCalendar(list) {
  const scheduleByDate = {};
  list.forEach((s) => {
    scheduleByDate[s.date] = (scheduleByDate[s.date] || []).concat(s);
  });
  const datesWithShifts = Object.keys(scheduleByDate).sort();

  scheduleCalendar.innerHTML = '';
  if (datesWithShifts.length === 0) {
    scheduleCalendar.innerHTML = '<p class="no-shifts-msg">Нет смен. Кнопка «Найти замену» ниже — для создания заявки на любой день.</p>';
    return;
  }
  datesWithShifts.forEach((dateStr) => {
    const shifts = scheduleByDate[dateStr];
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.innerHTML = `
      <span class="day-num">${dateStr}</span>
      <span>${shifts.map((s) => s.time || s.location || s.subject || '').filter(Boolean).join(', ') || '—'}</span>
    `;
    scheduleCalendar.appendChild(cell);
  });
}

// ——— Заявки ———
async function loadReplacements() {
  try {
    const res = await fetch(`${API}/replacements`, { headers: apiHeaders() });
    const list = await res.json();
    replacementsList.innerHTML = list.length
      ? list.map((r) => {
          const isOpen = r.status === 'open';
          const isOwn = r.requester_id === user?.id;
          return `
            <li>
              <span>${r.date} ${r.time || ''} ${r.location || ''} — ${r.reason || '-'} (${r.status})</span>
              ${isOpen && !isOwn ? `
                <span>
                  <button type="button" class="btn-respond" data-id="${r.id}" data-date="${r.date}" data-time="${r.time || ''}" data-location="${r.location || ''}">Могу</button>
                  <button type="button" class="btn-decline" data-id="${r.id}" data-date="${r.date}" data-time="${r.time || ''}" data-location="${r.location || ''}">Не могу</button>
                </span>
              ` : ''}
            </li>`;
        }).join('')
      : '<li>Нет заявок</li>';

    replacementsList.querySelectorAll('.btn-respond').forEach((b) => {
      b.addEventListener('click', () => sendResponse(b.dataset.id, true));
    });
    replacementsList.querySelectorAll('.btn-decline').forEach((b) => {
      b.addEventListener('click', () => openResponseDialog(b.dataset));
    });
  } catch (err) {
    replacementsList.innerHTML = '<li>Ошибка загрузки заявок</li>';
  }
}

function openRequestDialog(presetDate) {
  requestRequesterName.textContent = user?.email || '';
  formRequest.querySelector('[name="date"]').value = presetDate || '';
  formRequest.querySelector('[name="time"]').value = '';
  formRequest.querySelector('[name="location"]').value = '';
  formRequest.querySelector('[name="reason"]').value = '';
  dialogRequest.showModal();
}

btnNewRequest.addEventListener('click', () => openRequestDialog());

cancelRequest.addEventListener('click', () => dialogRequest.close());

formRequest.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(formRequest);
  try {
    const res = await fetch(`${API}/replacements`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        date: fd.get('date'),
        time: fd.get('time') || null,
        location: fd.get('location') || null,
        reason: fd.get('reason') || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || 'Ошибка', 'error');
      return;
    }
    dialogRequest.close();
    showToast('Заявка создана');
    loadReplacements();
    loadSchedule();
  } catch (err) {
    showToast('Ошибка сети', 'error');
  }
});

// ——— Отклик ———
function openResponseDialog(dataset) {
  formResponse.querySelector('[name="request_id"]').value = dataset.id;
  responseRequestInfo.textContent = `${dataset.date} ${dataset.time} ${dataset.location || ''}`;
  responseDeclineReason.classList.add('hidden');
  formResponse.querySelector('[name="reason"]').value = '';
  dialogResponse.showModal();
}

formResponse.querySelectorAll('button[name="can_cover"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.value === 'true') {
      sendResponse(formResponse.querySelector('[name="request_id"]').value, true);
      dialogResponse.close();
    } else {
      responseDeclineReason.classList.remove('hidden');
    }
  });
});

cancelResponse.addEventListener('click', () => dialogResponse.close());

formResponse.addEventListener('submit', async (e) => {
  e.preventDefault();
  const requestId = formResponse.querySelector('[name="request_id"]').value;
  const reason = formResponse.querySelector('[name="reason"]').value;
  await sendResponse(requestId, false, reason);
  dialogResponse.close();
  responseDeclineReason.classList.add('hidden');
});

async function sendResponse(requestId, canCover, reason) {
  try {
    const res = await fetch(`${API}/responses`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ request_id: requestId, can_cover: canCover, reason: reason || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || 'Ошибка', 'error');
      return;
    }
    showToast(canCover ? 'Замена выполнена' : 'Отклик отправлен');
    loadReplacements();
    loadSchedule();
  } catch (err) {
    showToast('Ошибка сети', 'error');
  }
}

// ——— Добавить смену (только админ) ———
btnAddShift.addEventListener('click', async () => {
  const select = formAddShift.querySelector('[name="user_id"]');
  select.innerHTML = '<option value="">Загрузка...</option>';
  dialogAddShift.showModal();
  try {
    const res = await fetch(`${API}/profiles`, { headers: apiHeaders() });
    const list = await res.json().catch(() => []);
    select.innerHTML = '';
    (Array.isArray(list) ? list : []).forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name || p.email || p.id;
      select.appendChild(opt);
    });
    if (select.options.length === 0) select.innerHTML = '<option value="">Нет преподавателей</option>';
  } catch (err) {
    select.innerHTML = '<option value="">Ошибка загрузки</option>';
  }
  const today = new Date().toISOString().slice(0, 10);
  formAddShift.querySelector('[name="date"]').value = today;
  formAddShift.querySelector('[name="time"]').value = '';
  formAddShift.querySelector('[name="location"]').value = '';
  formAddShift.querySelector('[name="subject"]').value = '';
});

cancelAddShift.addEventListener('click', () => dialogAddShift.close());

formAddShift.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(formAddShift);
  if (!fd.get('user_id')) {
    showToast('Выберите преподавателя', 'error');
    return;
  }
  try {
    const res = await fetch(`${API}/schedule`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        user_id: fd.get('user_id'),
        date: fd.get('date'),
        time: fd.get('time') || null,
        location: fd.get('location') || null,
        subject: fd.get('subject') || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || 'Ошибка', 'error');
      return;
    }
    dialogAddShift.close();
    showToast('Смена добавлена');
    loadSchedule();
  } catch (err) {
    showToast('Ошибка сети', 'error');
  }
});

// ——— Сгенерировать расписание на месяц (админ) ———
btnGenerateMonth.addEventListener('click', async () => {
  const y = parseInt(genYearInput.value, 10);
  const m = parseInt(genMonthInput.value, 10);
  if (!y || !m || m < 1 || m > 12) {
    showToast('Укажите год и месяц (1–12)', 'error');
    return;
  }
  try {
    const res = await fetch(`${API}/schedule/generate-month`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ year: y, month: m }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || 'Ошибка', 'error');
      return;
    }
    showToast(data.message || `Добавлено смен: ${data.added || 0}`);
    genYearInput.value = '';
    genMonthInput.value = '';
    loadSchedule();
  } catch (err) {
    showToast('Ошибка сети', 'error');
  }
});

// Подставляем текущий месяц в форму генерации при открытии
function setDefaultGenerateMonth() {
  const now = new Date();
  if (genYearInput && !genYearInput.value) genYearInput.value = now.getFullYear();
  if (genMonthInput && !genMonthInput.value) genMonthInput.value = now.getMonth() + 1;
}
if (adminAddShiftSection) adminAddShiftSection.addEventListener('focusin', setDefaultGenerateMonth);

// Инициализация
showScreen(!!token);

// Telegram Mini App: растянуть на весь экран и применить тему
if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || 'var(--bg)');
  document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || 'var(--text)');
}
