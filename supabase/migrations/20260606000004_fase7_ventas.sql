-- 1. Crear tabla ventas
CREATE TABLE IF NOT EXISTS public.ventas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
    total numeric NOT NULL,
    descuento numeric DEFAULT 0 NOT NULL,
    metodo_pago text CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')) NOT NULL,
    creado_por uuid REFERENCES public.profiles(id) NOT NULL,
    caja_id uuid, -- Para integración con el arqueo de caja diario (Fase 8)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla venta_detalles
CREATE TABLE IF NOT EXISTS public.venta_detalles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    venta_id uuid REFERENCES public.ventas(id) ON DELETE CASCADE NOT NULL,
    producto_id uuid REFERENCES public.productos(id) ON DELETE RESTRICT NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric NOT NULL,
    subtotal numeric NOT NULL
);

-- 3. Habilitar RLS en ventas y venta_detalles
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_detalles ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas RLS
CREATE POLICY "Permitir lectura de ventas a usuarios autenticados" ON public.ventas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir inserción de ventas a usuarios autenticados" ON public.ventas
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir lectura de detalles a usuarios autenticados" ON public.venta_detalles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir inserción de detalles a usuarios autenticados" ON public.venta_detalles
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

-- 5. Función de PostgreSQL (RPC) transaccional para registro atómico de ventas y stock
CREATE OR REPLACE FUNCTION public.registrar_venta(
    p_cliente_id uuid,
    p_total numeric,
    p_descuento numeric,
    p_metodo_pago text,
    p_items jsonb, -- [{producto_id: uuid, cantidad: int, precio_unitario: numeric}]
    p_caja_id uuid DEFAULT NULL
) RETURNS uuid SECURITY DEFINER AS $$
DECLARE
    new_venta_id uuid;
    item record;
    stock_disponible integer;
BEGIN
    -- Validar que quien ejecuta la función esté activo
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND activo = true
    ) THEN
        RAISE EXCEPTION 'Acceso denegado. Perfil inactivo o inexistente.';
    END IF;

    -- 1. Validar disponibilidad de stock de todos los productos
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS (producto_id uuid, cantidad integer) LOOP
        SELECT stock_actual INTO stock_disponible FROM public.productos WHERE id = item.producto_id;
        IF stock_disponible IS NULL THEN
            RAISE EXCEPTION 'Uno de los productos seleccionados no existe en el catálogo.';
        END IF;
        IF stock_disponible < item.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para completar la venta.';
        END IF;
    END LOOP;

    -- 2. Insertar la venta
    INSERT INTO public.ventas (
        cliente_id,
        total,
        descuento,
        metodo_pago,
        creado_por,
        caja_id
    ) VALUES (
        p_cliente_id,
        p_total,
        p_descuento,
        p_metodo_pago,
        auth.uid(),
        p_caja_id
    ) RETURNING id INTO new_venta_id;

    -- 3. Insertar detalles e insertar movimientos de stock (el trigger update_product_stock descontará el inventario)
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS (producto_id uuid, cantidad integer, precio_unitario numeric) LOOP
        -- Insertar detalle de venta
        INSERT INTO public.venta_detalles (
            venta_id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal
        ) VALUES (
            new_venta_id,
            item.producto_id,
            item.cantidad,
            item.precio_unitario,
            (item.cantidad * item.precio_unitario)
        );

        -- Registrar movimiento de salida de stock
        INSERT INTO public.stock_movimientos (
            producto_id,
            tipo,
            cantidad,
            motivo,
            creado_por,
            caja_id
        ) VALUES (
            item.producto_id,
            'salida',
            item.cantidad,
            'Venta - Factura #' || SUBSTRING(new_venta_id::text, 1, 8),
            auth.uid(),
            p_caja_id
        );
    END LOOP;

    RETURN new_venta_id;
END;
$$ LANGUAGE plpgsql;
