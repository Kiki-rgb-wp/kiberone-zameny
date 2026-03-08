-- Замены KIBERone: начальная схема
-- Таблицы: profiles, schedule, replacement_requests, replacement_responses

-- Расширение для gen_random_uuid если ещё не включено
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Профили пользователей (синхронизация с auth.users через триггер или вручную)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'tutor' CHECK (role IN ('admin', 'tutor', 'assistant'))
);

-- Расписание смен: кто, когда, где ведёт занятие
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_user_date ON public.schedule(user_id, date);

-- Заявки на замену
CREATE TABLE IF NOT EXISTS public.replacement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_replacement_requests_status ON public.replacement_requests(status);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_requester ON public.replacement_requests(requester_id);

-- Отклики на заявки (Могу/Не могу; причина отказа видна только админу)
CREATE TABLE IF NOT EXISTS public.replacement_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.replacement_requests(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_cover BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_replacement_responses_request ON public.replacement_responses(request_id);

-- Включаем RLS для всех таблиц
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_responses ENABLE ROW LEVEL SECURITY;
