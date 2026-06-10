import React from 'react'
import { Badge } from '../../components/ui/Badge'
import { Edit2, Shield, User, PowerOff, Power } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const UserList = ({
  users,
  loading,
  onToggleActive,
  onRoleChange,
  onEdit
}) => {
  const { profile } = useAuth()

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Obteniendo personal del local...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-slate-400 font-medium">No se encontraron colaboradores registrados con los filtros aplicados.</p>
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
              <th className="px-6 py-4.5">Colaborador</th>
              <th className="px-6 py-4.5">Correo Electrónico</th>
              <th className="px-6 py-4.5">Rol de Acceso</th>
              <th className="px-6 py-4.5">Estado</th>
              <th className="px-6 py-4.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
            {users.map((user) => {
              const isSelf = user.id === profile?.id
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4.5 font-semibold text-slate-800">
                    {user.nombre} {user.apellido}
                    {isSelf && <span className="ml-2 text-xs text-violet-500 font-normal">(Usted)</span>}
                  </td>
                  
                  {/* Email */}
                  <td className="px-6 py-4.5 text-slate-500">
                    {user.email}
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4.5">
                    {isSelf ? (
                      <Badge variant="violet">{user.role}</Badge>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => onRoleChange(user, e.target.value)}
                        className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      >
                        <option value="vendedor">VENDEDOR</option>
                        <option value="administrador">ADMINISTRADOR</option>
                      </select>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4.5">
                    <Badge variant={user.activo ? 'success' : 'danger'}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4.5 text-right space-x-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all inline-flex"
                      title="Editar datos básicos"
                    >
                      <Edit2 size={16} />
                    </button>

                    {!isSelf && (
                      <button
                        onClick={() => onToggleActive(user)}
                        className={`p-1.5 rounded-lg border transition-all inline-flex ${
                          user.activo
                            ? 'border-rose-100 bg-rose-50/50 text-rose-500 hover:bg-rose-50 hover:text-rose-600'
                            : 'border-emerald-100 bg-emerald-50/50 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                        title={user.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                      >
                        {user.activo ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas (Móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {users.map((user) => {
          const isSelf = user.id === profile?.id
          return (
            <div
              key={user.id}
              className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 relative ${
                !user.activo ? 'opacity-70' : ''
              }`}
            >
              {/* Top part: Name and Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">
                    {user.nombre} {user.apellido}
                    {isSelf && <span className="ml-1.5 text-xs text-violet-500 font-normal">(Usted)</span>}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                </div>
                <Badge variant={user.activo ? 'success' : 'danger'}>
                  {user.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {/* Middle part: Role Selection */}
              <div className="flex items-center justify-between border-t border-slate-50/60 pt-3">
                <span className="text-xs text-slate-400 font-medium">Rol del sistema:</span>
                {isSelf ? (
                  <Badge variant="violet">{user.role}</Badge>
                ) : (
                  <select
                    value={user.role}
                    onChange={(e) => onRoleChange(user, e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600 focus:outline-none"
                  >
                    <option value="vendedor">VENDEDOR</option>
                    <option value="administrador">ADMINISTRADOR</option>
                  </select>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-2 border-t border-slate-50/60 pt-3 mt-1 justify-end">
                <button
                  onClick={() => onEdit(user)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>

                {!isSelf && (
                  <button
                    onClick={() => onToggleActive(user)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                      user.activo
                        ? 'border-rose-100 bg-rose-50/50 text-rose-500 hover:bg-rose-50'
                        : 'border-emerald-100 bg-emerald-50/50 text-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    {user.activo ? (
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
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
