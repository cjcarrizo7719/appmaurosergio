import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Lock, Mail, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Ingrese un formato de correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [globalError, setGlobalError] = useState(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setGlobalError(null)
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch (error) {
      console.error(error)
      // Ajustar mensaje para que sea amigable en español
      let friendlyMessage = error.message
      if (error.message === 'Invalid login credentials') {
        friendlyMessage = 'Credenciales inválidas. Verifique su correo y contraseña.'
      } else if (error.message.includes('desactivada')) {
        friendlyMessage = error.message
      }
      setGlobalError(friendlyMessage)
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
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Mauro Sergio</h1>
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mt-1">Manager</p>
          <p className="text-slate-400 text-sm mt-3">Inicie sesión para acceder al panel de control</p>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-medium animate-shake">
            <AlertCircle className="shrink-0 text-rose-500 mt-0.5" size={18} />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email input */}
          <div className="relative">
            <div className="absolute left-4 top-[38px] text-slate-400 z-10">
              <Mail size={18} />
            </div>
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="ejemplo@correo.com"
              error={errors.email?.message}
              required
              className="pl-7"
              {...register('email')}
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <div className="absolute left-4 top-[38px] text-slate-400 z-10">
              <Lock size={18} />
            </div>
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              required
              className="pl-7"
              {...register('password')}
            />
          </div>

          {/* Login button */}
          <Button
            type="submit"
            isLoading={loading}
            className="w-full mt-2 py-3"
            size="lg"
          >
            Ingresar al Sistema
          </Button>

          {/* Forgot Password redirect link */}
          <div className="text-center mt-4">
            <a
              href="/recuperar"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:underline transition-colors"
            >
              ¿Olvidó su contraseña?
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
