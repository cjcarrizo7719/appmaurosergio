-- 1. Crear tabla productos
CREATE TABLE IF NOT EXISTS public.productos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sku text UNIQUE NOT NULL,
    nombre text NOT NULL,
    categoria text NOT NULL,
    descripcion text,
    talle text,
    color text,
    temporada text,
    precio_costo numeric NOT NULL,
    precio_venta numeric NOT NULL,
    imagen_url text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    creado_por uuid REFERENCES public.profiles(id)
);

-- 2. Habilitar RLS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas RLS en la tabla productos
CREATE POLICY "Permitir lectura de productos a usuarios autenticados y activos" ON public.productos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir inserción de productos a administradores activos" ON public.productos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.role = 'administrador' AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir actualización de productos a administradores activos" ON public.productos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.role = 'administrador' AND p_check.activo = true
        )
    );
