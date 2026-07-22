import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-height-screen flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-slate-600 font-medium animate-pulse">Cargando datos seguros...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    // Si el perfil no existe o no se pudo cargar, redirigir a login para evitar bucles infinitos
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Si no tiene el rol permitido para esta vista, redirigir al Dashboard principal
    return <Navigate to="/" replace />
  }

  return children
}
