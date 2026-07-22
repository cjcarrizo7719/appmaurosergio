-- 1. Crear tabla profiles en esquema público
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    role text CHECK (role IN ('administrador', 'vendedor')) DEFAULT 'vendedor' NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para comprobar si el usuario es administrador (evita la recursión en RLS)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'administrador' AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Crear Políticas de Seguridad RLS
CREATE POLICY "Permitir lectura a dueños o administradores" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id OR public.check_is_admin()
    );

CREATE POLICY "Permitir actualización de perfil propio" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- 4. Trigger automático para sincronización básica en registros externos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido, role, activo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Nuevo'),
    COALESCE(new.raw_user_meta_data->>'apellido', 'Usuario'),
    COALESCE(new.raw_user_meta_data->>'role', 'vendedor'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Función de Base de Datos SECURITY DEFINER para que Administradores puedan registrar usuarios
CREATE OR REPLACE FUNCTION public.create_new_user(
    p_email TEXT,
    p_password TEXT,
    p_nombre TEXT,
    p_apellido TEXT,
    p_role TEXT
) RETURNS uuid SECURITY DEFINER AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Validar que quien ejecuta la función sea administrador y esté activo
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'administrador' AND activo = true
    ) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo administradores activos pueden crear usuarios.';
    END IF;

    -- Crear registro en auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        phone_change,
        phone_change_token,
        email_change_token_current,
        reauthentication_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('nombre', p_nombre, 'apellido', p_apellido, 'role', p_role),
        now(),
        now(),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
    ) RETURNING id INTO new_user_id;

    -- Crear identidad de Supabase Auth
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id,
        jsonb_build_object('sub', new_user_id, 'email', p_email),
        'email',
        new_user_id,
        now(),
        now(),
        now()
    );

    -- Asegurar perfil público
    INSERT INTO public.profiles (id, email, nombre, apellido, role, activo)
    VALUES (new_user_id, p_email, p_nombre, p_apellido, p_role, true)
    ON CONFLICT (id) DO UPDATE
    SET nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido,
        role = EXCLUDED.role,
        activo = true;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;
