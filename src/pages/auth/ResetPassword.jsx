import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Lock, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react'

const resetSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  // Verificar si hay una sesión activa temporal al montar el componente
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('El enlace de restablecimiento es inválido o ha expirado. Por favor, solicite uno nuevo.')
      }
    })
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (updateError) throw updateError

      // Cerrar sesión tras restablecer contraseña para forzar login limpio
      await supabase.auth.signOut()

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Error al actualizar contraseña:', err.message)
      setError(err.message || 'Ocurrió un error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Nueva Contraseña</h1>
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mt-1">Configuración segura</p>
          <p className="text-slate-400 text-sm mt-3">
            Ingrese y confirme su nueva contraseña de acceso.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-medium">
            <AlertCircle className="shrink-0 text-rose-500 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-emerald-50 text-emerald-500 rounded-full">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">¡Contraseña Actualizada!</h3>
            <p className="text-slate-500 text-sm">
              Su clave ha sido guardada correctamente. Será redirigido al inicio de sesión en un momento.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Password input */}
            <div className="relative">
              <div className="absolute left-4 top-[38px] text-slate-400 z-10">
                <Lock size={18} />
              </div>
              <Input
                label="Nueva Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                className="pl-7"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {/* Confirm Password input */}
            <div className="relative">
              <div className="absolute left-4 top-[38px] text-slate-400 z-10">
                <Lock size={18} />
              </div>
              <Input
                label="Confirmar Nueva Contraseña"
                type="password"
                placeholder="Repetir nueva contraseña"
                required
                className="pl-7"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              disabled={!!error}
              className="w-full mt-2 py-3"
              size="lg"
            >
              Actualizar Contraseña
            </Button>

            <div className="text-center mt-4">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Cancelar y volver</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
