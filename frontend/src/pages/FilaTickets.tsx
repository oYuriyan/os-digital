import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/services/api"
import {
  MessageSquare, Clock, AlertTriangle, ArrowRight,
  RefreshCw, Wifi, CheckCircle2, Loader2, User, Tag, Zap
} from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface MensagemConversa {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

interface Chamado {
  id: string
  telefone_origem: string
  cliente_id: string | null
  status: string
  resumo_ia: string | null
  prioridade_ia: string | null
  categoria_ia: string | null
  historico_conversa: MensagemConversa[]
  data_hora_criacao: string
  os_id_gerada: string | null
}

// ── Utilitários de exibição ───────────────────────────────────────────────────
const PRIORIDADE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  alta:  { label: "Alta",  color: "bg-red-100 text-red-700 border-red-200",    dot: "bg-red-500" },
  media: { label: "Média", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  baixa: { label: "Baixa", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
}

const CATEGORIA_CONFIG: Record<string, { label: string; emoji: string }> = {
  hardware: { label: "Hardware",  emoji: "🖥️" },
  software: { label: "Software",  emoji: "💻" },
  rede:     { label: "Rede",      emoji: "🌐" },
  duvida:   { label: "Dúvida",    emoji: "❓" },
}

const STATUS_COLUNAS = [
  { id: "triagem_ia",         label: "Triagem IA",         icon: Zap,          cor: "border-t-blue-500"   },
  { id: "aguardando_tecnico", label: "Aguardando Técnico", icon: AlertTriangle, cor: "border-t-orange-500" },
  { id: "resolvido_ia",       label: "Resolvido (IA)",     icon: CheckCircle2, cor: "border-t-emerald-500" },
  { id: "ordem_gerada",       label: "Ordem Gerada",       icon: ArrowRight,   cor: "border-t-slate-500"  },
]

function formatarHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

// ── Componente Card do Chamado ────────────────────────────────────────────────
function ChamadoCard({ chamado, onClick }: { chamado: Chamado; onClick: () => void }) {
  const prio = PRIORIDADE_CONFIG[chamado.prioridade_ia ?? "media"] ?? PRIORIDADE_CONFIG.media
  const cat  = CATEGORIA_CONFIG[chamado.categoria_ia ?? "duvida"] ?? CATEGORIA_CONFIG.duvida

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
              +{chamado.telefone_origem}
            </p>
            <p className="text-[10px] text-slate-400">{formatarHora(chamado.data_hora_criacao)}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prio.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
          {prio.label}
        </span>
      </div>

      {/* Resumo da IA */}
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
        {chamado.resumo_ia ?? "Aguardando análise da IA..."}
      </p>

      {/* Rodapé */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {cat.emoji} {cat.label}
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {chamado.historico_conversa.length} msg
        </span>
      </div>
    </div>
  )
}

// ── Modal de Detalhes ─────────────────────────────────────────────────────────
function ModalChamado({
  chamado, open, onClose, onTransformarOS, onAtualizar
}: {
  chamado: Chamado | null
  open: boolean
  onClose: () => void
  onTransformarOS: (id: string) => void
  onAtualizar: () => void
}) {
  const [atualizando, setAtualizando] = useState(false)

  if (!chamado) return null

  const prio = PRIORIDADE_CONFIG[chamado.prioridade_ia ?? "media"] ?? PRIORIDADE_CONFIG.media
  const cat  = CATEGORIA_CONFIG[chamado.categoria_ia ?? "duvida"] ?? CATEGORIA_CONFIG.duvida

  const handleMarcarResolvido = async () => {
    setAtualizando(true)
    try {
      await api.patch(`/chamados/${chamado.id}`, { status: "resolvido_ia" })
      toast.success("Chamado marcado como resolvido.")
      onAtualizar()
      onClose()
    } catch {
      toast.error("Erro ao atualizar chamado.")
    } finally {
      setAtualizando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full flex flex-col gap-0 p-0 overflow-hidden h-[85vh]">

        {/* ── Cabeçalho fixo ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-base">
            <MessageSquare className="h-5 w-5 text-blue-600 shrink-0" />
            Chamado via WhatsApp
            <span className={`ml-auto text-xs px-2 py-1 rounded-full border font-semibold ${prio.color}`}>
              {prio.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* ── Metadados ── */}
        <div className="grid grid-cols-2 gap-3 text-sm px-6 py-4 shrink-0">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Telefone</p>
            <p className="font-semibold">+{chamado.telefone_origem}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Categoria</p>
            <p className="font-semibold">{cat.emoji} {cat.label}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 col-span-2">
            <p className="text-xs text-slate-500 mb-1">Resumo da IA</p>
            <p className="font-medium text-slate-800">{chamado.resumo_ia ?? "—"}</p>
          </div>
        </div>

        {/* ── Histórico com scroll próprio ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Transcrição completa
          </p>
          <div className="space-y-3">
            {chamado.historico_conversa.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-100 text-slate-800 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}>
                  <p>{msg.content}</p>
                  {msg.timestamp && (
                    <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-slate-400" : "text-blue-200"}`}>
                      {formatarHora(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Botões sempre fixos na base ── */}
        <div className="shrink-0 flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          {chamado.status === "aguardando_tecnico" ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                disabled={atualizando}
                onClick={handleMarcarResolvido}
              >
                {atualizando
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <CheckCircle2 className="h-4 w-4 mr-2" />
                }
                Marcar como Resolvido
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { onTransformarOS(chamado.id); onClose() }}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Transformar em OS
              </Button>
            </>
          ) : (
            <p className="text-xs text-slate-400 mx-auto self-center py-1">
              Nenhuma ação disponível para este status.
            </p>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export function FilaTickets() {
  const navigate = useNavigate()
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null)

  const carregarChamados = async () => {
    setCarregando(true)
    try {
      const res = await api.get("/chamados/")
      setChamados(res.data)
    } catch {
      toast.error("Não foi possível carregar os chamados.")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarChamados() }, [])

  const handleTransformarOS = async (chamadoId: string) => {
    try {
      const res = await api.post(`/chamados/${chamadoId}/transformar-em-os`)
      const sugestao = res.data.sugestao_os
      // Navega para Nova OS passando os dados via state
      navigate("/os/nova", { state: { fromTicket: { ...sugestao, chamado_id: res.data.chamado_id } } })
    } catch {
      toast.error("Erro ao preparar dados para a OS.")
    }
  }

  const chamadosPorStatus = (status: string) =>
    chamados.filter((c) => c.status === status)

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Fila de Chamados L1
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tickets recebidos via WhatsApp · Triagem automatizada por IA
          </p>
        </div>
        <Button variant="outline" onClick={carregarChamados} disabled={carregando} className="self-start sm:self-auto">
          {carregando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {/* Contador rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_COLUNAS.map((col) => {
          const Icon = col.icon
          const count = chamadosPorStatus(col.id).length
          return (
            <div key={col.id} className={`bg-white rounded-xl border-t-4 ${col.cor} border border-slate-200 p-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{col.label}</p>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Kanban */}
      {carregando ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {STATUS_COLUNAS.map((col) => {
            const Icon = col.icon
            const itens = chamadosPorStatus(col.id)
            return (
              <div key={col.id} className="flex flex-col gap-3">
                {/* Cabeçalho da coluna */}
                <div className={`flex items-center gap-2 pb-2 border-b-2 ${col.cor.replace("border-t-", "border-")}`}>
                  <Icon className="h-4 w-4 text-slate-600" />
                  <h2 className="text-sm font-bold text-slate-700">{col.label}</h2>
                  <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {itens.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {itens.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 text-slate-400">
                      <Wifi className="h-6 w-6" />
                      <p className="text-xs">Vazio</p>
                    </div>
                  ) : (
                    itens.map((chamado) => (
                      <ChamadoCard
                        key={chamado.id}
                        chamado={chamado}
                        onClick={() => setChamadoSelecionado(chamado)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ModalChamado
        chamado={chamadoSelecionado}
        open={!!chamadoSelecionado}
        onClose={() => setChamadoSelecionado(null)}
        onTransformarOS={handleTransformarOS}
        onAtualizar={carregarChamados}
      />
    </div>
  )
}
