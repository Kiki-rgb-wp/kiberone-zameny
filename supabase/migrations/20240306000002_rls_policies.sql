-- RLS-политики: админ видит всё, преподаватель/ассистент — только свои данные

-- ========== profiles ==========
-- Чтение: все авторизованные видят профили (для отображения имён); админ — всё
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Обновление профиля только своего
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Вставка профиля при регистрации (или через service role)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========== schedule ==========
-- Преподаватель видит только свои смены (user_id = auth.uid())
CREATE POLICY "schedule_select_own" ON public.schedule
  FOR SELECT USING (auth.uid() = user_id);

-- Админ видит все смены
CREATE POLICY "schedule_select_admin" ON public.schedule
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Вставка/обновление/удаление расписания — только через service role (API от имени админа) или админ
CREATE POLICY "schedule_all_admin" ON public.schedule
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ========== replacement_requests ==========
-- Пользователь видит свои заявки (requester_id = auth.uid())
CREATE POLICY "replacement_requests_select_own" ON public.replacement_requests
  FOR SELECT USING (auth.uid() = requester_id);

-- Админ видит все заявки
CREATE POLICY "replacement_requests_select_admin" ON public.replacement_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Все авторизованные видят открытые заявки (чтобы откликаться); детали заявки — свои или админ
-- Для списка "открытых заявок по роли" достаточно видеть все открытые (без чужих причин при необходимости — можно ограничить в API)
CREATE POLICY "replacement_requests_select_open" ON public.replacement_requests
  FOR SELECT TO authenticated
  USING (status = 'open');

-- Создание заявки — только от своего имени
CREATE POLICY "replacement_requests_insert_own" ON public.replacement_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Обновление статуса заявки — админ или система (через service role)
CREATE POLICY "replacement_requests_update_admin" ON public.replacement_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ========== replacement_responses ==========
-- Отклики: автор отклика видит свой отклик; админ видит все (в т.ч. reason при отказе)
CREATE POLICY "replacement_responses_select_own" ON public.replacement_responses
  FOR SELECT USING (auth.uid() = responder_id);

CREATE POLICY "replacement_responses_select_admin" ON public.replacement_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Вставка отклика — от своего имени (responder_id = auth.uid())
CREATE POLICY "replacement_responses_insert_own" ON public.replacement_responses
  FOR INSERT WITH CHECK (auth.uid() = responder_id);

-- Триггер: при регистрации в auth.users создавать запись в profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'tutor')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
