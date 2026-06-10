import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { AlertCircle, CheckCircle, Upload, Image as ImageIcon } from 'lucide-react'

const productSchema = z.object({
  sku: z.string().min(3, 'El SKU debe tener al menos 3 caracteres').regex(/^[a-zA-Z0-9_-]+$/, 'El SKU solo puede contener letras, números, guiones y guiones bajos (sin espacios)'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  categoria: z.string().min(2, 'La categoría es requerida'),
  descripcion: z.string().optional().or(z.literal('')),
  talle: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
  temporada: z.string().optional().or(z.literal('')),
  precio_costo: z.coerce.number().positive('El precio de costo debe ser mayor a 0'),
  precio_venta: z.coerce.number().positive('El precio de venta debe ser mayor a 0')
}).refine((data) => data.precio_venta >= data.precio_costo, {
  message: 'El precio de venta no puede ser menor al precio de costo',
  path: ['precio_venta']
})

const CATEGORIAS_COMUNES = ['Sweaters', 'Remeras', 'Jeans', 'Pantalones', 'Poleras', 'Cardigans', 'Camisas', 'Accesorios']
const TEMPORADAS_COMUNES = ['Invierno', 'Verano', 'Otoño', 'Primavera', 'Permanente']

export const ProductForm = ({ product, onSuccess, onCancel }) => {
  const { session } = useAuth()
  const isEditMode = !!product
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Imagen
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(product?.imagen_url || null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: product?.sku || '',
      nombre: product?.nombre || '',
      categoria: product?.categoria || '',
      descripcion: product?.descripcion || '',
      talle: product?.talle || '',
      color: product?.color || '',
      temporada: product?.temporada || '',
      precio_costo: product?.precio_costo || '',
      precio_venta: product?.precio_venta || ''
    }
  })

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('La imagen seleccionada supera el límite de 3MB.')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('El archivo seleccionado debe ser una imagen.')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  const uploadImage = async (file, sku) => {
    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${sku}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('producto-imagenes')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('producto-imagenes')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Error al subir imagen:', err.message)
      throw new Error('No se pudo subir la foto del producto. Verifique los permisos del Storage.')
    } finally {
      setUploadingImage(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      let finalImageUrl = product?.imagen_url || null

      // Subir imagen si se seleccionó un archivo nuevo
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, data.sku)
      }

      const payload = {
        sku: data.sku,
        nombre: data.nombre,
        categoria: data.categoria,
        descripcion: data.descripcion || null,
        talle: data.talle || null,
        color: data.color || null,
        temporada: data.temporada || null,
        precio_costo: parseFloat(data.precio_costo),
        precio_venta: parseFloat(data.precio_venta),
        imagen_url: finalImageUrl,
        creado_por: session?.user?.id
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('productos')
          .update(payload)
          .eq('id', product.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('productos')
          .insert([payload])

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err) {
      console.error('Error al guardar producto:', err.message)
      let friendlyMessage = err.message
      if (err.message.includes('unique_sku') || err.message.includes('productos_sku_key')) {
        friendlyMessage = 'El SKU ingresado ya se encuentra registrado para otro producto.'
      }
      setError(friendlyMessage || 'Ha ocurrido un error inesperado al guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
          <CheckCircle className="shrink-0 text-emerald-500" size={18} />
          <span>¡Producto guardado con éxito! Redirigiendo...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
          <AlertCircle className="shrink-0 text-rose-500" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Imagen del Producto Uploader */}
      <div className="flex flex-col sm:flex-row gap-5 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
        <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0">
          {imagePreview ? (
            <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={32} className="text-slate-350" />
          )}
        </div>
        <div className="flex-1 w-full text-center sm:text-left">
          <p className="text-sm font-bold text-slate-800">Fotografía del Producto</p>
          <p className="text-xs text-slate-400 mt-0.5">Formatos admitidos: PNG, JPG, WEBP. Máximo 3MB.</p>
          <div className="mt-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-655 cursor-pointer shadow-xs transition-colors">
              <Upload size={14} />
              <span>{imagePreview ? 'Cambiar Foto' : 'Cargar Foto'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SKU y Nombre */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="SKU (Código Único)"
          placeholder="Ej: SW-01-NAV"
          error={errors.sku?.message}
          required
          disabled={isEditMode}
          {...register('sku')}
        />
        <div className="sm:col-span-2">
          <Input
            label="Nombre del Producto"
            placeholder="Ej: Sweater Cuello Redondo Clásico"
            error={errors.nombre?.message}
            required
            {...register('nombre')}
          />
        </div>
      </div>

      {/* Categoría, Talle, Color, Temporada */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-semibold text-slate-700">Categoría</label>
          <select
            {...register('categoria')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all text-slate-700 text-sm h-[46px]"
          >
            <option value="">Seleccionar...</option>
            {CATEGORIAS_COMUNES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.categoria?.message && (
            <p className="text-xs text-rose-500 mt-0.5 font-medium">{errors.categoria.message}</p>
          )}
        </div>

        <Input
          label="Talle"
          placeholder="Ej: XL, 42"
          error={errors.talle?.message}
          {...register('talle')}
        />

        <Input
          label="Color"
          placeholder="Ej: Azul Marino"
          error={errors.color?.message}
          {...register('color')}
        />

        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-semibold text-slate-700">Temporada</label>
          <select
            {...register('temporada')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all text-slate-700 text-sm h-[46px]"
          >
            <option value="">Seleccionar...</option>
            {TEMPORADAS_COMUNES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.temporada?.message && (
            <p className="text-xs text-rose-500 mt-0.5 font-medium">{errors.temporada.message}</p>
          )}
        </div>
      </div>

      {/* Precios de costo y venta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Precio Costo ($)"
          type="number"
          step="0.01"
          placeholder="Ej: 4500.00"
          error={errors.precio_costo?.message}
          required
          {...register('precio_costo')}
        />
        <Input
          label="Precio Venta ($)"
          type="number"
          step="0.01"
          placeholder="Ej: 8900.00"
          error={errors.precio_venta?.message}
          required
          {...register('precio_venta')}
        />
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-semibold text-slate-700">Descripción (Opcional)</label>
        <textarea
          placeholder="Detalles sobre el hilado, tejido o cuidados..."
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-750 text-sm placeholder-slate-400"
          {...register('descripcion')}
        />
        {errors.descripcion?.message && (
          <p className="text-xs text-rose-500 mt-0.5 font-medium">{errors.descripcion.message}</p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-6">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading || success || uploadingImage}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={loading || uploadingImage}
          disabled={success}
        >
          {isEditMode ? 'Guardar Cambios' : 'Registrar Producto'}
        </Button>
      </div>
    </form>
  )
}
