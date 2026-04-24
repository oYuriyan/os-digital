import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { User, LockKeyhole, Loader2 } from "lucide-react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

export function Login() {
  const navigate = useNavigate()
  const { loginState } = useAuth()
  
  const [login, setLogin] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setCarregando(true)

    try {
      const resposta = await api.post("/login/", {
        login: login,
        senha: senha
      })

      const { access_token, usuario_nome, usuario_id, usuario_cargo } = resposta.data

      loginState(access_token, {
        id: usuario_id,
        nome: usuario_nome,
        cargo: usuario_cargo
      })

      navigate("/dashboard")

    } catch (error: any) {
      console.error(error)
      if (error.response && error.response.data) {
        setErro(error.response.data.detail || "Usuário ou senha incorretos.")
      } else {
        setErro("Não foi possível conectar ao servidor. O sistema local pode estar desligado.")
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full font-sans antialiased relative bg-slate-950 overflow-hidden items-center justify-center p-4 selection:bg-blue-500/30 selection:text-white">
      
      {/* Premium Ambient Backgrounds (Wow Effect) */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none mix-blend-screen"></div>

      {/* Main Glass Card */}
      <Card className="w-full max-w-[420px] border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl z-10 relative overflow-hidden rounded-2xl">
        
        {/* Subtle top border reflection */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <CardHeader className="space-y-4 text-center pt-10 pb-8 px-8">
          <div className="mx-auto flex items-center justify-center mb-2">
             <img src="/logo_oficial.png" alt="Micro Sistema Soluções" className="h-14 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>
          <div className="space-y-1">
            <CardDescription className="text-slate-400 text-sm font-medium">
               Painel Operacional Avançado
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {erro && (
              <div className="p-3 text-sm font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg text-center backdrop-blur-sm">
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login" className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Usuário
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  id="login" 
                  type="text" 
                  placeholder="Nome de usuário" 
                  required 
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Senha
                </Label>
              </div>
              <div className="relative group">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all rounded-xl"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={carregando}
              className="w-full h-12 mt-4 text-[15px] font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] rounded-xl"
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Acessar Sistema"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}