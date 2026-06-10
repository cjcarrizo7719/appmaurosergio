import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CajaContext = createContext({})

export const CajaProvider = ({ children }) => {
  const { user } = useAuth()
  const [cajaActiva, setCajaActiva] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkCajaActiva = async () => {
    if (!user) {
      setCajaActiva(null)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cajas')
        .select('*')
        .eq('estado', 'abierta')
        .maybeSingle()

      if (error) throw error
      setCajaActiva(data || null)
    } catch (err) {
      console.error('Error al comprobar caja activa:', err)
      setCajaActiva(null)
    } finally {
      setLoading(false)
    }
  }

  // Reload when auth user changes
  useEffect(() => {
    checkCajaActiva()
  }, [user])

  const abrirCaja = async (montoApertura) => {
    if (!user) throw new Error('No autenticado')
    
    const { data, error } = await supabase
      .from('cajas')
      .insert([
        {
          monto_apertura: Number(montoApertura),
          estado: 'abierta',
          usuario_apertura_id: user.id
        }
      ])
      .select()
      .single()

    if (error) throw error
    setCajaActiva(data)
    return data
  }

  const cerrarCaja = async (cajaId, dataCierre) => {
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('cajas')
      .update({
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString(),
        monto_cierre_efectivo: Number(dataCierre.monto_cierre_efectivo),
        monto_cierre_tarjeta: Number(dataCierre.monto_cierre_tarjeta),
        monto_cierre_transferencia: Number(dataCierre.monto_cierre_transferencia),
        saldo_esperado: Number(dataCierre.saldo_esperado),
        saldo_real: Number(dataCierre.saldo_real),
        diferencia: Number(dataCierre.diferencia),
        observaciones: dataCierre.observaciones || null,
        usuario_cierre_id: user.id
      })
      .eq('id', cajaId)
      .select()
      .single()

    if (error) throw error
    setCajaActiva(null) // Cleared after closing
    return data
  }

  return (
    <CajaContext.Provider
      value={{
        cajaActiva,
        loading,
        checkCajaActiva,
        abrirCaja,
        cerrarCaja
      }}
    >
      {children}
    </CajaContext.Provider>
  )
}

export const useCaja = () => useContext(CajaContext)
