import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import Login from '../pages/auth/Login'
import Recover from '../pages/auth/Recover'
import ResetPassword from '../pages/auth/ResetPassword'
import Dashboard from '../pages/dashboard'
import UsersAdmin from '../pages/users'
import ClientsAdmin from '../pages/clients'
import ProductsAdmin from '../pages/products'
import StockAdmin from '../pages/stock'
import SalesAdmin from '../pages/sales'
import CashAdmin from '../pages/cash'
import PlaceholderPage from '../pages/PlaceholderPage'

export const AppRouter = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<Recover />} />
      <Route path="/restablecer" element={<ResetPassword />} />

      {/* Rutas Protegidas (Acceso Común) */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'vendedor']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/clientes"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'vendedor']}>
            <ClientsAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/productos"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'vendedor']}>
            <ProductsAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stock"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'vendedor']}>
            <StockAdmin />
          </ProtectedRoute>
        }
      />


      <Route
        path="/ventas"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'vendedor']}>
            <SalesAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/caja"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'vendedor']}>
            <CashAdmin />
          </ProtectedRoute>
        }
      />

      {/* Rutas Protegidas (Acceso Administrador Únicamente) */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <UsersAdmin />
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
