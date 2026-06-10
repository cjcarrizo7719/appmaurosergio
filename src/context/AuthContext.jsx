import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = async (userId) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw profileError
      }

      if (data && !data.activo) {
        // Si el usuario está inactivo, forzar cierre de sesión
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
        throw new Error('Su cuenta ha sido desactivada. Póngase en contacto con el administrador.')
      }

      setProfile(data)
      setError(null)
    } catch (err) {
      console.error('Error al obtener perfil:', err.message)
      setError(err.message)
      setProfile(null)
    }
  }

  useEffect(() => {
    // Obtener sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    setError(null)
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      throw loginError
    }

    return data
  }

  const logout = async () => {
    setLoading(true)
    const { error: logoutError } = await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setLoading(false)
    if (logoutError) throw logoutError
  }

  const value = {
    session,
    profile,
    loading,
    error,
    login,
    logout,
    isAdmin: profile?.role === 'administrador',
    isSeller: profile?.role === 'vendedor',
    refetchProfile: () => session?.user && fetchProfile(session.user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
