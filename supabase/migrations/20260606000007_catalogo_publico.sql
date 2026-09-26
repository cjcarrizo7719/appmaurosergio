-- Fase 10: Política de lectura pública para el catálogo web
-- Permite que visitantes no autenticados (rol anon) lean productos activos.
-- Solo expone prendas con activo = true; precio_costo nunca se selecciona desde el frontend.

CREATE POLICY "Catálogo público: lectura de productos activos"
ON public.productos
FOR SELECT
TO anon
USING (activo = true);
