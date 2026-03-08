-- Роль при регистрации берётся из user_metadata.role (тьютор или ассистент)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  user_role := NEW.raw_user_meta_data->>'role';
  IF user_role IS NULL OR user_role NOT IN ('tutor', 'assistant') THEN
    user_role := 'tutor';
  END IF;
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = EXCLUDED.email;
  -- роль при конфликте не трогаем (чтобы не затереть admin)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
