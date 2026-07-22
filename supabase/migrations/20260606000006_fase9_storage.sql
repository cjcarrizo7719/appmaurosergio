-- Fase 9: Configuración de Storage para imágenes de productos

-- 1. Crear el bucket producto-imagenes (público para lectura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('producto-imagenes', 'producto-imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que usuarios autenticados suban imágenes
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'producto-imagenes');

-- 3. Permitir que usuarios autenticados reemplacen imágenes existentes
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'producto-imagenes');

-- 4. Lectura pública para mostrar imágenes en la app y en cualquier canal de venta
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'producto-imagenes');

-- 5. Permitir que usuarios autenticados eliminen imágenes
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'producto-imagenes');
