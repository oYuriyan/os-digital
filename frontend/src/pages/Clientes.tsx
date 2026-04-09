import { useState, useEffect } from "react"
import { Building2, Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { api } from "@/services/api"

export function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)

  // Estado do formulário
  const [formData, setFormData] = useState({
    razao_social: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: ""
  })

  // Função para buscar os clientes no banco
  const carregarClientes = async () => {
    setCarregando(true)
    try {
      const resposta = await api.get("/clientes/")
      setClientes(resposta.data)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    } finally {
      setCarregando(false)
    }
  }

  // Carrega ao abrir a tela
  useEffect(() => {
    carregarClientes()
  }, [])

  // Função para salvar um novo cliente
  const handleCriarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      await api.post("/clientes/", formData)
      
      // Limpa o formulário e fecha o modal
      setFormData({ razao_social: "", cnpj: "", email: "", telefone: "", endereco: "" })
      setModalAberto(false)
      
      // Atualiza a tabela com o novo cliente
      carregarClientes()
      
    } catch (error) {
      console.error("Erro ao criar cliente:", error)
      alert("Erro ao cadastrar cliente. Verifique os dados e o CNPJ.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Cabeçalho e Botão de Novo Cliente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Empresas e Clientes</h2>
          <p className="text-slate-500 mt-1">Gerencie a carteira de clientes ativos do sistema.</p>
        </div>
        
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button className="bg-slate-950 hover:bg-slate-800 text-white shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
              <DialogDescription>
                Insira os dados da empresa. O CNPJ deve ser único no sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCriarCliente} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social / Nome Fantasia *</Label>
                <Input 
                  id="razao_social" 
                  required 
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input 
                    id="cnpj" 
                    required 
                    placeholder="Somente números"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail Corporativo</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input 
                  id="endereco" 
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Empresa"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de Pesquisa e Tabela */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9 bg-white" />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhum cliente cadastrado no sistema.
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {cliente.razao_social}
                    </TableCell>
                    <TableCell className="text-slate-600">{cliente.cnpj}</TableCell>
                    <TableCell className="text-slate-600">{cliente.email || "-"}</TableCell>
                    <TableCell className="text-slate-600">{cliente.telefone || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}