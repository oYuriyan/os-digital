import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/Layout"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { ThemeProvider } from "./components/theme-provider"
import { NovaOS } from "./pages/NovaOS"
import { ListaOS } from "./pages/ListaOS"
import { EditarOS } from "./pages/EditarOS"
import { Clientes } from "./pages/Clientes"
import { Equipe } from "./pages/Equipe"
import { FilaTickets } from "./pages/FilaTickets"
import { Configuracoes } from "./pages/Configuracoes"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="os-digital-theme">
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rotas Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/os" element={<ListaOS />} />
              <Route path="/os/nova" element={<NovaOS />} />
              <Route path="/os/editar/:id" element={<EditarOS />} />
              
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/tickets" element={<FilaTickets />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          <Route path="*" element={
            <div className="flex h-screen items-center justify-center">
              <h1 className="text-2xl font-bold text-red-500">404 - Página não encontrada</h1>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App