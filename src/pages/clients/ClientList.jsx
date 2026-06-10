import React from 'react'
import { Badge } from '../../components/ui/Badge'
import { Edit2, PowerOff, Power, MessageSquare, Phone, Mail, Calendar } from 'lucide-react'

export const ClientList = ({
  clients,
  loading,
  onToggleActive,
  onEdit
}) => {

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Obteniendo listado de clientes...</p>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-slate-400 font-medium">No se encontraron clientes registrados con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <>
      {/* Vista de Tabla (Escritorio) */}
      <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4.5">Cliente</th>
              <th className="px-6 py-4.5">Contacto</th>
              <th className="px-6 py-4.5 text-center">Talle Habitual</th>
              <th className="px-6 py-4.5">Cumpleaños</th>
              <th className="px-6 py-4.5">Estado</th>
              <th className="px-6 py-4.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm text-slate-750">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                {/* Nombre y Observaciones */}
                <td className="px-6 py-4.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{client.nombre} {client.apellido}</span>
                    {client.observaciones && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[200px]" title={client.observaciones}>
                        <MessageSquare size={12} className="shrink-0 text-slate-300" />
                        <span>{client.observaciones}</span>
                      </span>
                    )}
                  </div>
                </td>

                {/* Contacto */}
                <td className="px-6 py-4.5">
                  <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                    {client.telefono && <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {client.telefono}</span>}
                    {client.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {client.email}</span>}
                    {!client.telefono && !client.email && <span className="text-slate-400">-</span>}
                  </div>
                </td>

                {/* Talle Habitual */}
                <td className="px-6 py-4.5 text-center">
                  {client.talle_habitual ? (
                    <Badge variant="violet">{client.talle_habitual}</Badge>
                  ) : (
                    <span className="text-slate-400 text-xs italic">No indicado</span>
                  )}
                </td>

                {/* Cumpleaños */}
                <td className="px-6 py-4.5 text-slate-500">
                  {client.fecha_nacimiento ? (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDate(client.fecha_nacimiento)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>

                {/* Estado */}
                <td className="px-6 py-4.5">
                  <Badge variant={client.activo ? 'success' : 'danger'}>
                    {client.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>

                {/* Acciones */}
                <td className="px-6 py-4.5 text-right space-x-2">
                  <button
                    onClick={() => onEdit(client)}
                    className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all inline-flex animate-hover"
                    title="Editar ficha de cliente"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => onToggleActive(client)}
                    className={`p-1.5 rounded-lg border transition-all inline-flex ${
                      client.activo
                        ? 'border-rose-100 bg-rose-50/50 text-rose-500 hover:bg-rose-50 hover:text-rose-600'
                        : 'border-emerald-100 bg-emerald-50/50 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                    title={client.activo ? 'Desactivar cliente' : 'Activar cliente'}
                  >
                    {client.activo ? <PowerOff size={16} /> : <Power size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas (Móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {clients.map((client) => (
          <div
            key={client.id}
            className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 relative ${
              !client.activo ? 'opacity-70' : ''
            }`}
          >
            {/* Top part: Name and Status */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{client.nombre} {client.apellido}</h3>
                <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500">
                  {client.telefono && <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {client.telefono}</span>}
                  {client.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {client.email}</span>}
                  {client.fecha_nacimiento && <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> {formatDate(client.fecha_nacimiento)}</span>}
                </div>
              </div>
              <Badge variant={client.activo ? 'success' : 'danger'}>
                {client.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            {/* Middle: Preferences */}
            <div className="border-t border-slate-50/60 pt-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Talle habitual:</span>
                {client.talle_habitual ? (
                  <Badge variant="violet">{client.talle_habitual}</Badge>
                ) : (
                  <span className="text-slate-400 italic">No especificado</span>
                )}
              </div>
              {client.observaciones && (
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-50/50 text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-600 block mb-0.5">Observaciones:</span>
                  {client.observaciones}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 border-t border-slate-50/60 pt-3 justify-end">
              <button
                onClick={() => onEdit(client)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-semibold text-slate-500 hover:text-slate-750 hover:bg-slate-50 transition-colors"
              >
                <Edit2 size={14} />
                <span>Editar</span>
              </button>

              <button
                onClick={() => onToggleActive(client)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  client.activo
                    ? 'border-rose-100 bg-rose-50/50 text-rose-500 hover:bg-rose-50'
                    : 'border-emerald-100 bg-emerald-50/50 text-emerald-500 hover:bg-emerald-50'
                }`}
              >
                {client.activo ? (
                  <>
                    <PowerOff size={14} />
                    <span>Desactivar</span>
                  </>
                ) : (
                  <>
                    <Power size={14} />
                    <span>Activar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
