import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react'

const recoverSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Ingrese un formato de correo electrónico válido')
})

export default function Recover() {
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm({
    resolver: zodResolver(recoverSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      // Definir la URL de redirección basada en la ubicación del cliente
      const redirectUrl = `${window.location.origin}/restablecer`
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl
      })

      if (resetError) throw resetError
      setSuccess(true)
    } catch (err) {
      console.error('Error al enviar recuperación:', err.message)
      setError(err.message || 'Ocurrió un error al procesar su solicitud.')
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
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Recuperar Acceso</h1>
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mt-1">Soporte técnico</p>
          <p className="text-slate-400 text-sm mt-3">
            Ingrese su correo electrónico y le enviaremos las instrucciones de restablecimiento de contraseña.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-medium animate-shake">
            <AlertCircle className="shrink-0 text-rose-500 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-emerald-50 text-emerald-500 rounded-full">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">¡Correo Enviado!</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Si la dirección de correo `{getValues('email')}` coincide con un usuario registrado, recibirá un enlace de recuperación en los próximos minutos.
            </p>
            <div className="pt-4">
              <a
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Volver al inicio de sesión</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <div className="absolute left-4 top-[38px] text-slate-400 z-10">
                <Mail size={18} />
              </div>
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="ejemplo@correo.com"
                required
                className="pl-7"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-2 py-3"
              size="lg"
            >
              Enviar Instrucciones
            </Button>

            <div className="text-center mt-4">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Volver al Login</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
