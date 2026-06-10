import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { AlertCircle, CheckCircle } from 'lucide-react'

const movementSchema = z.object({
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  ajusteDireccion: z.enum(['incrementar', 'disminuir']).optional(),
  cantidad: z.coerce.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser mayor a 0'),
  motivo: z.string().min(4, 'El motivo debe tener al menos 4 caracteres')
})

export const StockForm = ({ selectedProduct, onSuccess, onCancel }) => {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      tipo: 'entrada',
      ajusteDireccion: 'incrementar',
      cantidad: '',
      motivo: ''
    }
  })

  const tipoValue = watch('tipo')

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      let finalCantidad = data.cantidad

      // Si es salida, la cantidad se inserta positiva en BD, y el Trigger la resta.
      // Si es ajuste de tipo 'disminuir', la cantidad se multiplica por -1 en BD.
      if (data.tipo === 'ajuste' && data.ajusteDireccion === 'disminuir') {
        finalCantidad = data.cantidad * -1
      }

      // Validar si el stock actual permite la salida sin dejar stock negativo (opcional, pero buena práctica)
      if (data.tipo === 'salida' && selectedProduct.stock_actual < data.cantidad) {
        throw new Error(`Stock insuficiente. El stock actual de esta prenda es de ${selectedProduct.stock_actual} unidades.`);
      }
      if (data.tipo === 'ajuste' && data.ajusteDireccion === 'disminuir' && selectedProduct.stock_actual < data.cantidad) {
        throw new Error(`Ajuste inválido. No se puede disminuir más stock del disponible (${selectedProduct.stock_actual} unidades).`);
      }

      const payload = {
        producto_id: selectedProduct.id,
        tipo: data.tipo,
        cantidad: finalCantidad,
        motivo: data.motivo,
        creado_por: session?.user?.id
      }

      const { error: insertError } = await supabase
        .from('stock_movimientos')
        .insert([payload])

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err) {
      console.error('Error al registrar movimiento:', err.message)
      setError(err.message || 'Ha ocurrido un error inesperado al guardar el movimiento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
          <CheckCircle className="shrink-0 text-emerald-500" size={18} />
          <span>¡Movimiento registrado correctamente!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
          <AlertCircle className="shrink-0 text-rose-500" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Producto (Bloqueado) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prenda Seleccionada</p>
        <p className="text-sm font-bold text-slate-800 mt-1">{selectedProduct?.nombre}</p>
        <div className="flex gap-4 mt-2 text-xs text-slate-500">
          <span>SKU: <strong className="text-slate-700">{selectedProduct?.sku}</strong></span>
          <span>Talle/Color: <strong className="text-slate-700">{selectedProduct?.talle}/{selectedProduct?.color}</strong></span>
          <span>Stock Actual: <strong className="text-slate-700">{selectedProduct?.stock_actual} unidades</strong></span>
        </div>
      </div>

      {/* Tipo de Movimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-semibold text-slate-700">Tipo de Movimiento</label>
          <select
            {...register('tipo')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all text-slate-700 text-sm h-[46px]"
          >
            <option value="entrada">Entrada (Reposición de mercadería)</option>
            <option value="salida">Salida (Pérdidas, robos o retiros)</option>
            <option value="ajuste">Ajuste (Corrección manual)</option>
          </select>
        </div>

        {/* Subtipo de ajuste (Si se selecciona ajuste) */}
        {tipoValue === 'ajuste' ? (
          <div className="flex flex-col gap-1 w-full animate-fade-in">
            <label className="text-sm font-semibold text-slate-700">Sentido del Ajuste</label>
            <select
              {...register('ajusteDireccion')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all text-slate-700 text-sm h-[46px]"
            >
              <option value="incrementar">Incrementar (+) (Encontrado de más)</option>
              <option value="disminuir">Disminuir (-) (Faltantes de stock)</option>
            </select>
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      {/* Cantidad */}
      <Input
        label="Cantidad de Unidades"
        type="number"
        placeholder="Ej: 10"
        required
        error={errors.cantidad?.message}
        {...register('cantidad')}
      />

      {/* Motivo */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-semibold text-slate-700">Motivo del Movimiento</label>
        <textarea
          placeholder="Ej: Recepción de fábrica del Sweater SW-01, Ajuste de rotura de prenda, etc."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-750 text-sm placeholder-slate-400"
          {...register('motivo')}
        />
        {errors.motivo?.message && (
          <p className="text-xs text-rose-500 mt-0.5 font-medium">{errors.motivo.message}</p>
        )}
      </div>

      {/* Botones */}
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
          Registrar Movimiento
        </Button>
      </div>
    </form>
  )
}
