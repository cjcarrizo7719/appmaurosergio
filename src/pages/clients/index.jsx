import React, { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { ClientList } from './ClientList'
import { ClientForm } from './ClientForm'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { supabase } from '../../lib/supabase'
import { UserPlus, Search, RefreshCw, AlertCircle } from 'lucide-react'

export default function ClientsAdmin() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('activos') // activos, inactivos, todos

  // Modal
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setClients(data || [])
    } catch (err) {
      console.error('Error al cargar clientes:', err.message)
      setError('No se pudieron obtener los clientes de la base de datos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleToggleActive = async (client) => {
    setError(null)
    const nuevoEstado = !client.activo
    try {
      const { error: updateError } = await supabase
        .from('clientes')
        .update({ activo: nuevoEstado })
        .eq('id', client.id)

      if (updateError) throw updateError

      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, activo: nuevoEstado } : c))
      )
    } catch (err) {
      console.error('Error al actualizar estado del cliente:', err.message)
      setError(`No se pudo ${nuevoEstado ? 'activar' : 'desactivar'} al cliente.`)
    }
  }

  const handleOpenCreate = () => {
    setSelectedClient(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (client) => {
    setSelectedClient(client)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    fetchClients()
  }

  // Filtrado de clientes en cliente para velocidad instantánea
  const filteredClients = clients.filter((client) => {
    const fullName = `${client.nombre} ${client.apellido}`.toLowerCase()
    const emailMatches = client.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const phoneMatches = client.telefono?.includes(searchTerm) || false
    const nameMatches = fullName.includes(searchTerm.toLowerCase())
    const matchesSearch = nameMatches || emailMatches || phoneMatches

    if (statusFilter === 'activos') {
      return matchesSearch && client.activo
    } else if (statusFilter === 'inactivos') {
      return matchesSearch && !client.activo
    }
    return matchesSearch
  })

  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Cartera de Clientes</h2>
            <p className="text-slate-400 text-sm mt-0.5">Gestione la información, talles y gustos de sus compradores</p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5"
          >
            <UserPlus size={18} />
            <span>Nuevo Cliente</span>
          </Button>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o número telefónico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 placeholder-slate-400 transition-all text-sm animate-focus"
            />
          </div>

          {/* Estatus selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-655 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
            >
              <option value="activos">Clientes Activos</option>
              <option value="inactivos">Clientes Inactivos</option>
              <option value="todos">Todos los Clientes</option>
            </select>

            <button
              onClick={fetchClients}
              className="p-2.5 rounded-xl border border-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Refrescar lista"
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

        {/* Client List */}
        <ClientList
          clients={filteredClients}
          loading={loading}
          onToggleActive={handleToggleActive}
          onEdit={handleOpenEdit}
        />

        {/* Modal Form */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={selectedClient ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
          size="lg"
        >
          <ClientForm
            client={selectedClient}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </Modal>
      </div>
    </PageLayout>
  )
}
