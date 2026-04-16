import { useState, useEffect } from "react"
import { Plus, ShieldCheck, Wrench, Loader2, KeyRound, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Badge } from "@/components/ui/badge"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

export function Equipe() {
  const { usuario: userLogado } = useAuth()
  const isGestor = userLogado?.cargo?.includes("Gestor") || userLogado?.cargo?.includes("Admin")

  const [usuarios, setUsuarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  // Modals States
  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)

  // Targets
  const [usuarioAlvoId, setUsuarioAlvoId] = useState("")
  const [usuarioAlvoNome, setUsuarioAlvoNome] = useState("")
  const [novaSenha, setNovaSenha] = useState("")

  // Formulários
  const [formDataCriar, setFormDataCriar] = useState({
    nome: "",
    login: "",
    senha: "",
    cargo: ""
  })

  // Permite valores opcionais, caso algum campo não seja atualizado
  const [formDataEditar, setFormDataEditar] = useState({
    nome: "",
    login: "",
    cargo: ""
  })

  const carregarUsuarios = async () => {
    setCarregando(true)
    try {
      const resposta = await api.get("/usuarios/")
      setUsuarios(resposta.data)
    } catch (error) {
      console.error("Erro ao carregar equipe:", error)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  // =======================
  // FUNÇÕES DE CRUD
  // =======================
  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.post("/usuarios/", formDataCriar)
      setFormDataCriar({ nome: "", login: "", senha: "", cargo: "" })
      setModalCriarAberto(false)
      carregarUsuarios()
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao cadastrar usuário.")
    } finally {
      setSalvando(false)
    }
  }

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      // Montar payload com apenas os campos preenchidos iterativamente
      const payload: any = {}
      if (formDataEditar.nome) payload.nome = formDataEditar.nome
      if (formDataEditar.login) payload.login = formDataEditar.login
      if (formDataEditar.cargo) payload.cargo = formDataEditar.cargo

      await api.put(`/usuarios/${usuarioAlvoId}`, payload)
      setModalEditarAberto(false)
      carregarUsuarios()
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao editar usuário.")
    } finally {
      setSalvando(false)
    }
  }

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.put(`/usuarios/${usuarioAlvoId}/senha`, { nova_senha: novaSenha })
      setNovaSenha("")
      setModalSenhaAberto(false)
      alert("Senha redefinida com sucesso pelo Gestor.")
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao redefinir a senha.")
    } finally {
      setSalvando(false)
    }
  }

  const handleDeletarUsuario = async (id: string, nome: string) => {
    if (!window.confirm(`ATENÇÃO: Tem certeza que deseja exluir permanentemente o usuário ${nome}?`)) return
    
    try {
      await api.delete(`/usuarios/${id}`)
      alert("Usuário excluído com sucesso.")
      carregarUsuarios()
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao excluir. O usuário emitiu OS associadas no passado.")
    }
  }

  function abrirEdicao(user: any) {
     setUsuarioAlvoId(user.id);
     setFormDataEditar({ nome: user.nome, login: user.login, cargo: user.cargo })
     setModalEditarAberto(true);
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Equipe</h2>
          <p className="text-slate-500 mt-1">Administre acessos, cadastre ou gerencie a conta dos colaboradores.</p>
        </div>
        
        {isGestor && (
          <Dialog open={modalCriarAberto} onOpenChange={setModalCriarAberto}>
            <DialogTrigger asChild>
              <Button className="bg-slate-950 hover:bg-slate-800 text-white shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Novo Acesso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Cadastrar Membro</DialogTitle>
                <DialogDescription>
                  Crie credenciais de acesso para um novo colaborador.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCriarUsuario} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input 
                    id="nome" required 
                    value={formDataCriar.nome}
                    onChange={(e) => setFormDataCriar({ ...formDataCriar, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login">Nome de Usuário (Login)</Label>
                  <Input 
                    id="login" type="text" required placeholder="ex: pedro.tecnico"
                    value={formDataCriar.login}
                    onChange={(e) => setFormDataCriar({ ...formDataCriar, login: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input 
                      id="senha" type="password" required 
                      value={formDataCriar.senha}
                      onChange={(e) => setFormDataCriar({ ...formDataCriar, senha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo / Perfil</Label>
                    <Select required onValueChange={(valor) => setFormDataCriar({ ...formDataCriar, cargo: valor })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Técnico de Campo">Técnico de Campo</SelectItem>
                        <SelectItem value="Analista de Suporte">Analista de Suporte</SelectItem>
                        <SelectItem value="Gestor">Gestor / Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4 gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalCriarAberto(false)}>Cancelar</Button>
                  <Button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Colaborador</TableHead>
                <TableHead>Identificação (Login)</TableHead>
                <TableHead>Cargo</TableHead>
                {isGestor && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={isGestor ? 4 : 3} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isGestor ? 4 : 3} className="text-center py-8 text-slate-500">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {user.nome.substring(0, 2).toUpperCase()}
                      </div>
                      {user.nome}
                    </TableCell>
                    <TableCell className="text-slate-600 font-mono text-sm">{user.login}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                        {user.cargo.toLowerCase().includes("gestor") ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Wrench className="h-4 w-4 text-blue-600" />
                        )}
                        {user.cargo}
                      </div>
                    </TableCell>
                    
                    {isGestor && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            <Button 
                                variant="ghost" size="icon" title="Editar Perfil"
                                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => abrirEdicao(user)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" size="icon" title="Redefinir Senha"
                                className="text-slate-500 hover:text-yellow-600 hover:bg-yellow-50"
                                onClick={() => {
                                    setUsuarioAlvoId(user.id);
                                    setUsuarioAlvoNome(user.nome);
                                    setNovaSenha("");
                                    setModalSenhaAberto(true);
                                }}
                            >
                                <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" size="icon" title="Excluir"
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeletarUsuario(user.id, user.nome)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal Redefinição de Senha */}
      <Dialog open={modalSenhaAberto} onOpenChange={setModalSenhaAberto}>
         <DialogContent className="sm:max-w-[400px] bg-white">
            <DialogHeader>
               <DialogTitle>Redefinir Senha</DialogTitle>
               <DialogDescription>
                  Isso irá resetar permanentemente a senha de <b>{usuarioAlvoNome}</b>.
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAlterarSenha} className="space-y-4 pt-2">
               <div className="space-y-2">
                  <Label htmlFor="nova_senha">Nova Senha</Label>
                  <Input 
                     id="nova_senha" type="text" required 
                     value={novaSenha}
                     onChange={(e) => setNovaSenha(e.target.value)}
                  />
               </div>
               <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setModalSenhaAberto(false)}>Cancelar</Button>
                  <Button type="submit" disabled={salvando} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                     {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Redefinir Senha"}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>

      {/* Modal Atualização de Perfil */}
      <Dialog open={modalEditarAberto} onOpenChange={setModalEditarAberto}>
         <DialogContent className="sm:max-w-[400px] bg-white">
            <DialogHeader>
               <DialogTitle>Editar Perfil</DialogTitle>
               <DialogDescription>
                  Altere os dados básicos do colaborador.
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditarUsuario} className="space-y-4 pt-2">
               <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input 
                     type="text" required 
                     value={formDataEditar.nome}
                     onChange={(e) => setFormDataEditar({ ...formDataEditar, nome: e.target.value })}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Identificação (Login)</Label>
                  <Input 
                     type="text" required 
                     value={formDataEditar.login}
                     onChange={(e) => setFormDataEditar({ ...formDataEditar, login: e.target.value })}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Cargo / Perfil</Label>
                  <Select value={formDataEditar.cargo} onValueChange={(valor) => setFormDataEditar({ ...formDataEditar, cargo: valor })}>
                     <SelectTrigger className="bg-white">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Técnico de Campo">Técnico de Campo</SelectItem>
                        <SelectItem value="Analista de Suporte">Analista de Suporte</SelectItem>
                        <SelectItem value="Gestor">Gestor / Admin</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setModalEditarAberto(false)}>Cancelar</Button>
                  <Button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white">
                     {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Alterações"}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>

    </div>
  )
}