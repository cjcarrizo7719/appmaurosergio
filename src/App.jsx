import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CajaProvider } from './context/CajaContext'
import { AppRouter } from './router'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CajaProvider>
          <AppRouter />
        </CajaProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
