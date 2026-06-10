-- 1. Agregar columnas de stock a productos
ALTER TABLE public.productos 
    ADD COLUMN IF NOT EXISTS stock_actual integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS stock_minimo integer DEFAULT 5 NOT NULL;

-- 2. Crear tabla stock_movimientos
CREATE TABLE IF NOT EXISTS public.stock_movimientos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id uuid REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
    tipo text CHECK (tipo IN ('entrada', 'salida', 'ajuste')) NOT NULL,
    cantidad integer NOT NULL,
    motivo text NOT NULL,
    creado_por uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    caja_id uuid -- Reservado para integraciones con caja y ventas en las siguientes fases
);

-- 3. Habilitar RLS en stock_movimientos
ALTER TABLE public.stock_movimientos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para stock_movimientos
CREATE POLICY "Permitir lectura de movimientos a usuarios autenticados y activos" ON public.stock_movimientos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir inserción de movimientos a administradores activos" ON public.stock_movimientos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.role = 'administrador' AND p_check.activo = true
        )
    );

-- 5. Trigger PostgreSQL para actualizar automáticamente el stock de productos
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger AS $$
BEGIN
  IF new.tipo = 'entrada' THEN
    UPDATE public.productos
    SET stock_actual = stock_actual + new.cantidad
    WHERE id = new.producto_id;
  ELSIF new.tipo = 'salida' THEN
    UPDATE public.productos
    SET stock_actual = stock_actual - new.cantidad
    WHERE id = new.producto_id;
  ELSIF new.tipo = 'ajuste' THEN
    -- En un ajuste, new.cantidad puede ser positivo (incremento) o negativo (decremento)
    UPDATE public.productos
    SET stock_actual = stock_actual + new.cantidad
    WHERE id = new.producto_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_stock_actual
  AFTER INSERT ON public.stock_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();
