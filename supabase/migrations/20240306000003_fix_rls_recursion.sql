-- Исправление бесконечной рекурсии в RLS: проверка "админ" не должна читать profiles через RLS.
-- Функция is_admin() с SECURITY DEFINER читает profiles от имени владельца (без RLS).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Удаляем политики, в которых проверка админа вызывала рекурсию
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "schedule_select_admin" ON public.schedule;
DROP POLICY IF EXISTS "schedule_all_admin" ON public.schedule;
DROP POLICY IF EXISTS "replacement_requests_select_admin" ON public.replacement_requests;
DROP POLICY IF EXISTS "replacement_requests_update_admin" ON public.replacement_requests;
DROP POLICY IF EXISTS "replacement_responses_select_admin" ON public.replacement_responses;

-- Восстанавливаем политики, используя is_admin() вместо чтения profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "schedule_select_admin" ON public.schedule
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "schedule_all_admin" ON public.schedule
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "replacement_requests_select_admin" ON public.replacement_requests
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "replacement_requests_update_admin" ON public.replacement_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "replacement_responses_select_admin" ON public.replacement_responses
  FOR SELECT TO authenticated
  USING (public.is_admin());
