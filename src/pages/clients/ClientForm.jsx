import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { AlertCircle, CheckCircle } from 'lucide-react'

const clientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
  telefono: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')).refine(val => !val || z.string().email().safeParse(val).success, {
    message: 'Ingrese un formato de correo electrónico válido'
  }),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  talle_habitual: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal(''))
})

const TALLES_COMUNES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46', '48', '50']

export const ClientForm = ({ client, onSuccess, onCancel }) => {
  const { session } = useAuth()
  const isEditMode = !!client
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Control para el selector híbrido de talle
  const [talleSelectMode, setTalleSelectMode] = useState('select') // select, custom
  const [customTalle, setCustomTalle] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre: client?.nombre || '',
      apellido: client?.apellido || '',
      telefono: client?.telefono || '',
      email: client?.email || '',
      fecha_nacimiento: client?.fecha_nacimiento || '',
      talle_habitual: client?.talle_habitual || '',
      observaciones: client?.observaciones || ''
    }
  })

  const talleValue = watch('talle_habitual')

  useEffect(() => {
    if (client?.talle_habitual) {
      if (TALLES_COMUNES.includes(client.talle_habitual)) {
        setTalleSelectMode('select')
      } else {
        setTalleSelectMode('custom')
        setCustomTalle(client.talle_habitual)
      }
    }
  }, [client])

  const handleTalleSelectChange = (e) => {
    const val = e.target.value
    if (val === 'custom') {
      setTalleSelectMode('custom')
      setValue('talle_habitual', customTalle)
    } else {
      setTalleSelectMode('select')
      setValue('talle_habitual', val)
    }
  }

  const handleCustomTalleChange = (e) => {
    const val = e.target.value
    setCustomTalle(val)
    setValue('talle_habitual', val)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono || null,
        email: data.email || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        talle_habitual: data.talle_habitual || null,
        observaciones: data.observaciones || null,
        creado_por: session?.user?.id
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('clientes')
          .update(payload)
          .eq('id', client.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('clientes')
          .insert([payload])

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err) {
      console.error('Error al guardar cliente:', err.message)
      setError(err.message || 'Ha ocurrido un error inesperado al guardar el cliente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
          <CheckCircle className="shrink-0 text-emerald-500" size={18} />
          <span>¡Cliente guardado con éxito! Redirigiendo...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
          <AlertCircle className="shrink-0 text-rose-500" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Ej: María"
          error={errors.nombre?.message}
          required
          {...register('nombre')}
        />
        <Input
          label="Apellido"
          placeholder="Ej: Gómez"
          error={errors.apellido?.message}
          required
          {...register('apellido')}
        />
      </div>

      {/* Teléfono y Correo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Teléfono de Contacto"
          placeholder="Ej: 2235551234"
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <Input
          label="Correo Electrónico (Opcional)"
          type="email"
          placeholder="ejemplo@correo.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      {/* Fila de Cumpleaños y Talle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha de Nacimiento"
          type="date"
          error={errors.fecha_nacimiento?.message}
          {...register('fecha_nacimiento')}
        />

        {/* Talle Habitual Selector Híbrido */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-semibold text-slate-700">Talle Habitual</label>
          {talleSelectMode === 'select' ? (
            <select
              value={TALLES_COMUNES.includes(talleValue) ? talleValue : ''}
              onChange={handleTalleSelectChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 text-sm h-[46px]"
            >
              <option value="">No especificado</option>
              {TALLES_COMUNES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="custom">Otro (Personalizado)...</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: talle especial, 54, etc."
                value={customTalle}
                onChange={handleCustomTalleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 text-sm h-[46px]"
              />
              <button
                type="button"
                onClick={() => {
                  setTalleSelectMode('select')
                  setValue('talle_habitual', '')
                }}
                className="px-3 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-xs font-semibold shrink-0"
              >
                Volver
              </button>
            </div>
          )}
          {errors.talle_habitual?.message && (
            <p className="text-xs text-rose-500 mt-0.5 font-medium">{errors.talle_habitual.message}</p>
          )}
        </div>
      </div>

      {/* Observaciones / Notas */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-semibold text-slate-700">Observaciones (Gustos, detalles)</label>
        <textarea
          placeholder="Escriba comentarios, preferencias de compra, etc."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-750 text-sm placeholder-slate-400"
          {...register('observaciones')}
        />
        {errors.observaciones?.message && (
          <p className="text-xs text-rose-500 mt-0.5 font-medium">{errors.observaciones.message}</p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-6">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading || success}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          disabled={success}
        >
          {isEditMode ? 'Guardar Cambios' : 'Registrar Cliente'}
        </Button>
      </div>
    </form>
  )
}
