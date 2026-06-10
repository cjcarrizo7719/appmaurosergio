import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { AlertCircle, CheckCircle } from 'lucide-react'

// Esquema de validación para creación
const createSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
  email: z.string().min(1, 'El correo electrónico es requerido').email('Ingrese un formato de correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres'),
  role: z.enum(['vendedor', 'administrador'])
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

// Esquema de validación para edición
const editSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
  role: z.enum(['vendedor', 'administrador'])
})

export const UserForm = ({ user, onSuccess, onCancel }) => {
  const isEditMode = !!user
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(isEditMode ? editSchema : createSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      role: user?.role || 'vendedor'
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      if (isEditMode) {
        // Actualizar perfil existente
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            nombre: data.nombre,
            apellido: data.apellido,
            role: data.role
          })
          .eq('id', user.id)

        if (updateError) throw updateError
      } else {
        // Crear nuevo usuario usando la función de base de datos SECURITY DEFINER
        const { data: newUserId, error: rpcError } = await supabase.rpc('create_new_user', {
          p_email: data.email,
          p_password: data.password,
          p_nombre: data.nombre,
          p_apellido: data.apellido,
          p_role: data.role
        })

        if (rpcError) throw rpcError
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err) {
      console.error(err)
      let friendlyMessage = err.message
      if (err.message.includes('unique_email') || err.message.includes('already exists')) {
        friendlyMessage = 'El correo electrónico ingresado ya se encuentra registrado.'
      }
      setError(friendlyMessage || 'Ha ocurrido un error inesperado al guardar el colaborador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Banner de éxito */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
          <CheckCircle className="shrink-0 text-emerald-500" size={18} />
          <span>¡Guardado correctamente! Redirigiendo...</span>
        </div>
      )}

      {/* Banner de error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
          <AlertCircle className="shrink-0 text-rose-500" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Fila Nombre y Apellido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Ej: Mauro"
          error={errors.nombre?.message}
          required
          {...register('nombre')}
        />
        <Input
          label="Apellido"
          placeholder="Ej: Sergio"
          error={errors.apellido?.message}
          required
          {...register('apellido')}
        />
      </div>

      {/* Correo Electrónico (Solo en creación) */}
      <Input
        label="Correo Electrónico"
        type="email"
        placeholder="ejemplo@correo.com"
        error={errors.email?.message}
        required
        disabled={isEditMode}
        {...register('email')}
      />

      {/* Campos de contraseña (Solo en creación) */}
      {!isEditMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            error={errors.password?.message}
            required
            {...register('password')}
          />
          <Input
            label="Confirmar Contraseña"
            type="password"
            placeholder="Repetir contraseña"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />
        </div>
      )}

      {/* Selección de Rol */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-semibold text-slate-700">Rol del Colaborador</label>
        <select
          {...register('role')}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 text-sm"
        >
          <option value="vendedor">Vendedor</option>
          <option value="administrador">Administrador</option>
        </select>
        {errors.role?.message && (
          <p className="text-xs text-rose-500 mt-0.5 font-medium">{errors.role.message}</p>
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
          {isEditMode ? 'Guardar Cambios' : 'Registrar Colaborador'}
        </Button>
      </div>
    </form>
  )
}
