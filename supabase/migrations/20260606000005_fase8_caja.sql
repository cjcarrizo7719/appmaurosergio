-- 1. Crear tabla cajas
CREATE TABLE IF NOT EXISTS public.cajas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha_apertura timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_cierre timestamp with time zone,
    monto_apertura numeric NOT NULL,
    monto_cierre_efectivo numeric,
    monto_cierre_tarjeta numeric,
    monto_cierre_transferencia numeric,
    total_ingresos numeric DEFAULT 0 NOT NULL,
    total_egresos numeric DEFAULT 0 NOT NULL,
    saldo_esperado numeric,
    saldo_real numeric,
    diferencia numeric,
    observaciones text,
    estado text CHECK (estado IN ('abierta', 'cerrada')) DEFAULT 'abierta' NOT NULL,
    usuario_apertura_id uuid REFERENCES public.profiles(id) NOT NULL,
    usuario_cierre_id uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Evitar que haya más de una caja abierta al mismo tiempo en el sistema
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_caja ON public.cajas (estado) WHERE (estado = 'abierta');

-- 2. Crear tabla caja_movimientos
CREATE TABLE IF NOT EXISTS public.caja_movimientos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    caja_id uuid REFERENCES public.cajas(id) ON DELETE CASCADE NOT NULL,
    tipo text CHECK (tipo IN ('ingreso', 'egreso')) NOT NULL,
    monto numeric NOT NULL,
    descripcion text NOT NULL,
    creado_por uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS en cajas y caja_movimientos
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_movimientos ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas RLS
CREATE POLICY "Permitir lectura de cajas a usuarios autenticados" ON public.cajas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir inserción de cajas a usuarios autenticados" ON public.cajas
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir actualización de cajas a usuarios autenticados" ON public.cajas
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir lectura de movimientos de caja a usuarios autenticados" ON public.caja_movimientos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

CREATE POLICY "Permitir inserción de movimientos de caja a usuarios autenticados" ON public.caja_movimientos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p_check 
            WHERE p_check.id = auth.uid() AND p_check.activo = true
        )
    );

-- 5. Redefinir la función registrar_venta para validar y vincular la caja activa
CREATE OR REPLACE FUNCTION public.registrar_venta(
    p_cliente_id uuid,
    p_total numeric,
    p_descuento numeric,
    p_metodo_pago text,
    p_items jsonb,
    p_caja_id uuid DEFAULT NULL
) RETURNS uuid SECURITY DEFINER AS $$
DECLARE
    new_venta_id uuid;
    item record;
    stock_disponible integer;
    v_caja_activa_id uuid;
BEGIN
    -- Validar que quien ejecuta la función esté activo
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND activo = true
    ) THEN
        RAISE EXCEPTION 'Acceso denegado. Perfil inactivo.';
    END IF;

    -- Validar/Vincular caja abierta activa
    SELECT id INTO v_caja_activa_id FROM public.cajas WHERE estado = 'abierta' LIMIT 1;
    IF v_caja_activa_id IS NULL THEN
        RAISE EXCEPTION 'No se puede registrar la venta. Debe abrir caja antes de realizar transacciones.';
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

    -- 2. Insertar la venta asociada a la caja activa
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
        v_caja_activa_id
    ) RETURNING id INTO new_venta_id;

    -- 3. Insertar detalles e insertar movimientos de stock (vinculando a la caja activa)
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
            v_caja_activa_id
        );
    END LOOP;

    RETURN new_venta_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Función de Base de Datos para cálculo consolidado y seguro del resumen de la caja activa
CREATE OR REPLACE FUNCTION public.obtener_resumen_caja(p_caja_id uuid)
RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
    v_monto_apertura numeric;
    v_ventas_efectivo numeric;
    v_ventas_tarjeta numeric;
    v_ventas_transferencia numeric;
    v_ingresos_manuales numeric;
    v_egresos_manuales numeric;
    v_saldo_esperado numeric;
BEGIN
    SELECT monto_apertura INTO v_monto_apertura FROM public.cajas WHERE id = p_caja_id;
    
    SELECT COALESCE(SUM(total), 0) INTO v_ventas_efectivo FROM public.ventas WHERE caja_id = p_caja_id AND metodo_pago = 'efectivo';
    SELECT COALESCE(SUM(total), 0) INTO v_ventas_tarjeta FROM public.ventas WHERE caja_id = p_caja_id AND metodo_pago = 'tarjeta';
    SELECT COALESCE(SUM(total), 0) INTO v_ventas_transferencia FROM public.ventas WHERE caja_id = p_caja_id AND metodo_pago = 'transferencia';
    
    SELECT COALESCE(SUM(monto), 0) INTO v_ingresos_manuales FROM public.caja_movimientos WHERE caja_id = p_caja_id AND tipo = 'ingreso';
    SELECT COALESCE(SUM(monto), 0) INTO v_egresos_manuales FROM public.caja_movimientos WHERE caja_id = p_caja_id AND tipo = 'egreso';
    
    v_saldo_esperado := v_monto_apertura + v_ventas_efectivo + v_ingresos_manuales - v_egresos_manuales;
    
    RETURN jsonb_build_object(
        'monto_apertura', v_monto_apertura,
        'ventas_efectivo', v_ventas_efectivo,
        'ventas_tarjeta', v_ventas_tarjeta,
        'ventas_transferencia', v_ventas_transferencia,
        'ingresos_manuales', v_ingresos_manuales,
        'egresos_manuales', v_egresos_manuales,
        'saldo_esperado', v_saldo_esperado
    );
END;
$$ LANGUAGE plpgsql;
