import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"

export function NovaOS() {
  const navigate = useNavigate()
  
  const [clientes, setClientes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)

  // O estado do nosso formulário
  const [formData, setFormData] = useState({
    cliente_id: "",
    tipo_servico: "",
    solicitante: "",
    setor: "",
    defeito_relatado: ""
  })

  // Assim que a tela carrega, busca os clientes na API
  useEffect(() => {
    async function carregarClientes() {
      try {
        const resposta = await api.get("/clientes/")
        setClientes(resposta.data)
      } catch (error) {
        console.error("Erro ao buscar clientes:", error)
      }
    }
    carregarClientes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)

    // Pega o ID do técnico logado no cofre do navegador
    const tecnico_id = localStorage.getItem("usuario_id")

    if (!tecnico_id) {
      toast.error("Erro de Autenticação", { description: "Técnico não identificado. Faça login novamente." })
      setCarregando(false)
      return
    }

    try {
      // Envia a nova OS para o Python
      await api.post("/os/", {
        ...formData,
        tecnico_id: tecnico_id
      })
      
      toast.success("OS Aberta com Sucesso!", { description: "A ordem de serviço já está no painel." })
      navigate("/dashboard") // Manda o técnico de volta pro painel central
      
    } catch (error) {
      console.error(error)
      toast.error("Erro", { description: "Não foi possível abrir a OS. Verifique os dados." })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Cabeçalho de Navegação */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")} className="bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
            <p className="text-sm text-slate-500">Preencha os detalhes do atendimento técnico.</p>
          </div>
        </div>

        {/* Formulário Principal */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Detalhes da Operação</CardTitle>
            <CardDescription>Selecione o cliente e descreva o problema relatado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Seleção de Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente / Empresa</Label>
                  <Select required onValueChange={(valor) => setFormData({ ...formData, cliente_id: valor })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Serviço */}
                <div className="space-y-2">
                  <Label htmlFor="tipo_servico">Tipo de Serviço</Label>
                  <Select required onValueChange={(valor) => setFormData({ ...formData, tipo_servico: valor })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manutenção Preventiva">Manutenção</SelectItem>
                      <SelectItem value="Manutenção Corretiva">Retirada de Equipamento</SelectItem>
                      <SelectItem value="Instalação de Equipamento">Instalação</SelectItem>
                      <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Solicitante */}
                <div className="space-y-2">
                  <Label htmlFor="solicitante">Nome do Solicitante</Label>
                  <Input 
                    id="solicitante" 
                    placeholder="Quem pediu o suporte?" 
                    required 
                    value={formData.solicitante}
                    onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                    className="bg-white"
                  />
                </div>

                {/* Setor */}
                <div className="space-y-2">
                  <Label htmlFor="setor">Setor / Departamento</Label>
                  <Input 
                    id="setor" 
                    placeholder="Ex: Financeiro, Diretoria..." 
                    required 
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Defeito Relatado (Área de Texto) */}
              <div className="space-y-2">
                <Label htmlFor="defeito">Defeito Relatado</Label>
                <Textarea 
                  id="defeito" 
                  placeholder="Descreva com detalhes o problema reportado pelo cliente..." 
                  required 
                  className="min-h-[120px] bg-white resize-none"
                  value={formData.defeito_relatado}
                  onChange={(e) => setFormData({ ...formData, defeito_relatado: e.target.value })}
                />
              </div>

              {/* Botão de Salvar */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={carregando}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
                >
                  {carregando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Abrir OS
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}