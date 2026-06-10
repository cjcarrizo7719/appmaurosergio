-- 1. Crear tabla clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    apellido text NOT NULL,
    telefono text,
    email text,
    fecha_nacimiento date,
    talle_habitual text,
    observaciones text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    creado_por uuid REFERENCES public.profiles(id)
);

-- 2. Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas RLS
CREATE POLICY "Permitir lectura de clientes a usuarios autenticados y activos" ON public.clientes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir inserción de clientes a usuarios autenticados y activos" ON public.clientes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir actualización de clientes a usuarios autenticados y activos" ON public.clientes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );
