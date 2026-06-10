import React, { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { UserList } from './UserList'
import { UserForm } from './UserForm'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { supabase } from '../../lib/supabase'
import { UserPlus, Search, RefreshCw, AlertCircle } from 'lucide-react'

export default function UsersAdmin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos') // todos, activos, inactivos
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setUsers(data || [])
    } catch (err) {
      console.error('Error al obtener usuarios:', err.message)
      setError('No se pudieron cargar los usuarios del sistema.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleActive = async (user) => {
    setError(null)
    const nuevoEstado = !user.activo
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ activo: nuevoEstado })
        .eq('id', user.id)

      if (updateError) throw updateError
      
      // Actualizar estado local
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, activo: nuevoEstado } : u))
      )
    } catch (err) {
      console.error('Error al actualizar estado:', err.message)
      setError(`No se pudo ${nuevoEstado ? 'activar' : 'desactivar'} el usuario.`)
    }
  }

  const handleRoleChange = async (user, newRole) => {
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id)

      if (updateError) throw updateError

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      console.error('Error al actualizar rol:', err.message)
      setError('No se pudo cambiar el rol del usuario.')
    }
  }

  const handleOpenCreate = () => {
    setSelectedUser(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (user) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    fetchUsers()
  }

  // Filtrado de usuarios en cliente
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.nombre} ${user.apellido}`.toLowerCase()
    const emailMatches = user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const nameMatches = fullName.includes(searchTerm.toLowerCase())
    const matchesSearch = nameMatches || emailMatches

    if (statusFilter === 'activos') {
      return matchesSearch && user.activo
    } else if (statusFilter === 'inactivos') {
      return matchesSearch && !user.activo
    }
    return matchesSearch
  })

  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Administración de Personal</h2>
            <p className="text-slate-400 text-sm mt-0.5">Gestione los accesos y roles de su equipo de trabajo</p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5"
          >
            <UserPlus size={18} />
            <span>Nuevo Colaborador</span>
          </Button>
        </div>

        {/* Filters and Actions Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 placeholder-slate-400 transition-all text-sm"
            />
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>

            <button
              onClick={fetchUsers}
              className="p-2.5 rounded-xl border border-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Actualizar lista"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
            <AlertCircle className="shrink-0 text-rose-500" size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* User List Table */}
        <UserList
          users={filteredUsers}
          loading={loading}
          onToggleActive={handleToggleActive}
          onRoleChange={handleRoleChange}
          onEdit={handleOpenEdit}
        />

        {/* Form Modal (Create / Edit) */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={selectedUser ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
          size="md"
        >
          <UserForm
            user={selectedUser}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </Modal>
      </div>
    </PageLayout>
  )
}
