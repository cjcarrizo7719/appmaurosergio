import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  ShoppingCart,
  Banknote,
  UserCog,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Badge } from '../ui/Badge'

export const Sidebar = () => {
  const { profile, logout, isAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message)
    }
  }

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrador', 'vendedor'] },
    { to: '/clientes', label: 'Clientes', icon: Users, roles: ['administrador', 'vendedor'] },
    { to: '/productos', label: 'Productos', icon: ShoppingBag, roles: ['administrador', 'vendedor'] },
    { to: '/stock', label: 'Stock', icon: Package, roles: ['administrador', 'vendedor'] },
    { to: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['administrador', 'vendedor'] },
    { to: '/caja', label: 'Caja', icon: Banknote, roles: ['administrador', 'vendedor'] },
    ...(isAdmin ? [{ to: '/usuarios', label: 'Personal', icon: UserCog, roles: ['administrador'] }] : [])
  ]

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={toggleSidebar}
          className="p-2.5 bg-white rounded-xl shadow-md border border-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-50 focus:outline-none transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-100 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-violet-600 tracking-tight">Mauro Sergio</h1>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Manager v1.0</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100/50 mx-4 my-3 rounded-2xl flex flex-col gap-2">
          <div>
            <p className="text-sm font-bold text-slate-800 truncate">
              {profile?.nombre} {profile?.apellido}
            </p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
          <div>
            <Badge variant={profile?.role === 'administrador' ? 'violet' : 'info'}>
              {profile?.role}
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-50 text-violet-700 shadow-sm shadow-violet-100/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay background for mobile when open */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-xs"
        />
      )}
    </>
  )
}
