import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  LogOut,
  FileText,
  Building2,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Toaster } from "@/components/ui/sonner"
import { MobileBottomNav } from "./MobileBottomNav"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { motion, AnimatePresence } from "framer-motion"

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOnline } = useNetworkStatus()
  
  const usuarioNome = localStorage.getItem("usuario_nome") || "Yuri Yan"
  const usuarioCargo = localStorage.getItem("usuario_cargo") || "Técnico"
  const iniciais = usuarioNome.substring(0, 2).toUpperCase()

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  // Definição das rotas do menu
  const menuItens = [
    { titulo: "Painel Central",      icone: LayoutDashboard, rota: "/dashboard" },
    { titulo: "Ordens de Serviço",   icone: FileText,         rota: "/os"        },
    { titulo: "Tickets / Fila L1",   icone: MessageSquare,   rota: "/tickets"   },
    { titulo: "Clientes",            icone: Building2,        rota: "/clientes"  },
    { titulo: "Equipe",              icone: Users,            rota: "/equipe"    },
  ]

  const NavLinks = () => (
    <nav className="space-y-1">
      {menuItens.map((item) => {
        const ativo = item.rota === "/os"
          ? location.pathname.startsWith("/os")
          : location.pathname === item.rota
        return (
          <Link key={item.rota} to={item.rota}>
            <span className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              ativo 
                ? "bg-slate-800 text-white" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}>
              <item.icone className="h-5 w-5" />
              {item.titulo}
            </span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 font-sans antialiased">
      
      {/* Sidebar Desktop (Fixa na esquerda) */}
      <aside className="hidden w-64 flex-col bg-slate-950 border-r border-slate-800 md:flex h-full shadow-2xl z-50">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800">
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">OS Digital</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <NavLinks />
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex flex-1 flex-col pb-16 md:pb-0 h-full overflow-hidden"> {/* Espaço para a barra inferior no mobile */}
        
        {/* Aviso de Offline */}
        {!isOnline && (
          <div className="w-full bg-yellow-500 text-yellow-950 text-center py-1.5 font-bold text-xs tracking-wide shadow-md z-50 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Você está offline. Modo de leitura ativado.
          </div>
        )}

        {/* Header Superior */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-6 shadow-sm z-10 sticky top-0">
          
          {/* Espaçador na Esquerda para Mobile Centralizar o Titulo (Se desejar) */}
          <div className="flex-1 md:hidden flex items-center gap-2">
             <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
                <Briefcase className="h-3 w-3 text-white" />
              </div>
             <span className="font-bold text-slate-900">OS Digital</span>
          </div>
          <div className="hidden md:flex flex-1" /> {/* Espaçador Desktop */}

          {/* Menu do Usuário */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarImage src="" alt={usuarioNome} />
                    <AvatarFallback className="bg-slate-100 text-slate-900 font-semibold">{iniciais}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{usuarioNome}</p>
                    <p className="text-xs leading-none text-slate-500">{usuarioCargo}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-slate-600">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Encerrar Sessão</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Conteúdo Dinâmico das Páginas entra aqui */}
        <main className="flex-1 overflow-y-auto bg-slate-50 overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileBottomNav />
      <Toaster position="top-right" richColors />
    </div>
  )
}