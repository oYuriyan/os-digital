import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus, Search, ArrowRight, Loader2, FileText,
  CheckCircle, Clock, AlertCircle, Filter
} from "lucide-react"
import { api } from "@/services/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OS {
  id: string
  numero_os: number
  cliente_id: string
  tecnico_id: string
  tipo_servico: string
  solicitante: string
  setor: string
  status: string
  data_hora_abertura: string
  data_hora_termino: string | null
}
interface Cliente { id: string; razao_social: string }
interface Usuario { id: string; nome: string }

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "fechada", label: "Concluída" },
]

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === "aberta") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      Aberta
    </span>
  )
  if (s === "em_andamento") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      Em Andamento
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
      <CheckCircle className="h-3 w-3" />
      Concluída
    </span>
  )
}

export function ListaOS() {
  const navigate = useNavigate()
  const [ordens, setOrdens] = useState<OS[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)

  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroTecnico, setFiltroTecnico] = useState("todos")

  useEffect(() => {
    async function carregar() {
      try {
        const [resOs, resClientes, resTecnicos] = await Promise.all([
          api.get("/os/"),
          api.get("/clientes/"),
          api.get("/usuarios/"),
        ])
        setOrdens(resOs.data)
        setClientes(resClientes.data)
        setTecnicos(resTecnicos.data)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [navigate])

  const getNomeCliente = (id: string) => clientes.find(c => c.id === id)?.razao_social ?? "—"
  const getNomeTecnico = (id: string) => tecnicos.find(t => t.id === id)?.nome ?? "—"

  const ordensFiltradas = useMemo(() => {
    return ordens
      .filter(os => {
        if (filtroStatus !== "todos" && os.status !== filtroStatus) return false
        if (filtroTecnico !== "todos" && os.tecnico_id !== filtroTecnico) return false
        if (busca.trim()) {
          const term = busca.toLowerCase()
          const nomeCliente = getNomeCliente(os.cliente_id).toLowerCase()
          const numOs = String(os.numero_os)
          if (!nomeCliente.includes(term) && !numOs.includes(term) && !os.solicitante.toLowerCase().includes(term)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.data_hora_abertura).getTime() - new Date(a.data_hora_abertura).getTime())
  }, [ordens, filtroStatus, filtroTecnico, busca, clientes])

  const totalAberta = ordens.filter(o => o.status === "aberta").length
  const totalAndamento = ordens.filter(o => o.status === "em_andamento").length
  const totalConcluida = ordens.filter(o => ["fechada", "concluida", "concluída"].includes(o.status)).length

  if (carregando) return (
    <div className="flex h-[80vh] items-center justify-center flex-col gap-3">
      <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      <p className="text-sm text-slate-500">Carregando ordens de serviço...</p>
    </div>
  )

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500 mt-0.5">{ordens.length} OS registradas no sistema</p>
        </div>
        <Button
          onClick={() => navigate("/os/nova")}
          className="bg-slate-900 hover:bg-slate-700 text-white h-9 text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova OS
        </Button>
      </div>

      {/* KPI rápidos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalAberta}</p>
            <p className="text-xs text-slate-500">Abertas</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalAndamento}</p>
            <p className="text-xs text-slate-500">Em Andamento</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalConcluida}</p>
            <p className="text-xs text-slate-500">Concluídas</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por número, cliente ou solicitante..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-50 border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-50 border-slate-200">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os técnicos</SelectItem>
              {tecnicos.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header da tabela */}
        <div className="grid grid-cols-[60px_1fr_1fr_120px_140px_120px_40px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>#OS</span>
          <span>Cliente</span>
          <span>Técnico / Serviço</span>
          <span>Solicitante</span>
          <span>Abertura</span>
          <span>Status</span>
          <span></span>
        </div>

        <div className="divide-y divide-slate-50">
          {ordensFiltradas.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhuma OS encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            ordensFiltradas.map(os => (
              <div
                key={os.id}
                className="grid grid-cols-[60px_1fr_1fr_120px_140px_120px_40px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => navigate(`/os/editar/${os.id}`)}
              >
                <span className="font-mono text-xs font-bold text-slate-400">#{os.numero_os}</span>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{getNomeCliente(os.cliente_id)}</p>
                  <p className="text-xs text-slate-400 truncate">{os.setor}</p>
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">{getNomeTecnico(os.tecnico_id)}</p>
                  <p className="text-xs text-slate-400 truncate">{os.tipo_servico}</p>
                </div>

                <span className="text-xs text-slate-600 truncate">{os.solicitante}</span>

                <span className="text-xs text-slate-400">
                  {format(new Date(os.data_hora_abertura), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>

                <StatusBadge status={os.status} />

                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600 transition-colors justify-self-end" />
              </div>
            ))
          )}
        </div>

        {ordensFiltradas.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            Exibindo {ordensFiltradas.length} de {ordens.length} OS
          </div>
        )}
      </div>
    </div>
  )
}
