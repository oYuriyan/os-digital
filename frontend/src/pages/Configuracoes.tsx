import { useState, useEffect, useCallback } from "react"
import { Settings, Wifi, WifiOff, QrCode, RefreshCw, Power, Loader2, MessageSquare, Bot, ShieldCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { api } from "@/services/api"
import { toast } from "sonner"

type ConnectionState = "open" | "close" | "connecting" | "unknown"

interface EvolutionStatus {
  state?: ConnectionState
  instance?: { instanceName?: string; status?: string }
}

function StatusBadge({ state }: { state: ConnectionState | "loading" }) {
  if (state === "loading") return (
    <Badge variant="outline" className="gap-1.5 text-slate-500 border-slate-200">
      <Loader2 className="h-3 w-3 animate-spin" /> Verificando...
    </Badge>
  )
  if (state === "open") return (
    <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Conectado
    </Badge>
  )
  if (state === "connecting") return (
    <Badge className="gap-1.5 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border border-yellow-200">
      <Loader2 className="h-3 w-3 animate-spin" /> Conectando...
    </Badge>
  )
  return (
    <Badge className="gap-1.5 bg-red-100 text-red-800 hover:bg-red-100 border border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Desconectado
    </Badge>
  )
}

export function Configuracoes() {
  const [status, setStatus] = useState<ConnectionState | "loading">("loading")
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [carregandoQr, setCarregandoQr] = useState(false)
  const [setupFeito, setSetupFeito] = useState(false)

  const verificarStatus = useCallback(async () => {
    try {
      const res = await api.get("/evolution/status")
      const data: EvolutionStatus = res.data.dados
      const state = (data?.instance?.status || data?.state || "close") as ConnectionState
      setStatus(state)
      if (state === "open") setQrcode(null) // Já conectado, esconde o QR
    } catch {
      setStatus("unknown" as ConnectionState)
    }
  }, [])

  useEffect(() => {
    verificarStatus()
    // Polling a cada 8s para atualizar o status automaticamente
    const interval = setInterval(verificarStatus, 8000)
    return () => clearInterval(interval)
  }, [verificarStatus])

  const handleSetup = async () => {
    try {
      await api.post("/evolution/setup")
      setSetupFeito(true)
      toast.success("Instância criada!", { description: "Agora gere o QR Code para conectar o WhatsApp." })
      verificarStatus()
    } catch (e: any) {
      // Se a instância já existe, não é um erro real
      const msg = e?.response?.data?.detail || ""
      if (msg.includes("already") || msg.includes("exists") || e?.response?.status === 409) {
        setSetupFeito(true)
        toast.info("Instância já existe. Pode gerar o QR Code!")
      } else {
        toast.error("Erro ao criar instância", { description: msg || "Verifique se a Evolution API está rodando." })
      }
    }
  }

  const handleGerarQR = async () => {
    setCarregandoQr(true)
    setQrcode(null)
    try {
      const res = await api.get("/evolution/qrcode")
      const dados = res.data.dados
      // A Evolution v2 retorna o base64 em diferentes campos dependendo da versão
      const base64 =
        dados?.qrcode?.base64 ||
        dados?.base64 ||
        dados?.code ||
        null
      if (base64) {
        setQrcode(base64.startsWith("data:image") ? base64 : `data:image/png;base64,${base64}`)
        toast.success("QR Code gerado!", { description: "Escaneie com o WhatsApp do celular corporativo." })
      } else {
        toast.info("WhatsApp já pode estar conectado. Verifique o status acima.")
        verificarStatus()
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Verifique se a instância foi criada primeiro."
      toast.error("Erro ao gerar QR Code", { description: msg })
    } finally {
      setCarregandoQr(false)
    }
  }

  const isConectado = status === "open"

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-slate-500">Gerencie as integrações e preferências do sistema.</p>
        </div>
      </div>

      {/* ── Seção WhatsApp ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">WhatsApp & Atendimento</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Card de Status de Conexão */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {isConectado
                    ? <Wifi className="h-4 w-4 text-emerald-500" />
                    : <WifiOff className="h-4 w-4 text-red-400" />
                  }
                  Status da Conexão
                </CardTitle>
                <StatusBadge state={status} />
              </div>
              <CardDescription>
                Número corporativo conectado à plataforma via Evolution API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1">
                <p><span className="font-semibold">Instância:</span> atendimento-os</p>
                <p><span className="font-semibold">Gateway:</span> Evolution API v2</p>
                <p><span className="font-semibold">Webhook:</span> /chamados/webhook/evolution</p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={verificarStatus}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Atualizar Status
                </Button>

                {!setupFeito && !isConectado && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={handleSetup}
                  >
                    <Power className="h-3.5 w-3.5" />
                    Criar Instância (1ª vez)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card de QR Code */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4 text-slate-600" />
                Parear WhatsApp
              </CardTitle>
              <CardDescription>
                {isConectado
                  ? "Número já conectado. Para trocar, desconecte pelo celular e gere um novo QR."
                  : "Gere o QR Code e escaneie com o celular corporativo para ativar o bot."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isConectado ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Wifi className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-emerald-700">WhatsApp Ativo</p>
                  <p className="text-xs text-slate-500 max-w-[200px]">
                    O bot está recebendo mensagens e respondendo automaticamente.
                  </p>
                </div>
              ) : (
                <>
                  {qrcode ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-xl border-2 border-slate-200 p-2 bg-white">
                        <img src={qrcode} alt="QR Code WhatsApp" className="w-44 h-44 object-contain" />
                      </div>
                      <p className="text-xs text-slate-500 text-center">
                        Abra o WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho
                      </p>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleGerarQR}>
                        <RefreshCw className="h-3 w-3" /> Gerar novo QR
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                        <QrCode className="h-7 w-7 text-slate-400" />
                      </div>
                      <Button
                        className="gap-2 bg-slate-900 hover:bg-slate-700 text-white"
                        onClick={handleGerarQR}
                        disabled={carregandoQr}
                      >
                        {carregandoQr
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
                          : <><QrCode className="h-4 w-4" /> Gerar QR Code</>
                        }
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ── Seção Agente IA ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Agente de IA (L1)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Modelo Ativo</CardTitle>
              <CardDescription>Configuração atual do agente de atendimento automático.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Modelo</span>
                  <Badge variant="outline" className="text-xs font-mono">llama-3.3-70b-versatile</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Provedor</span>
                  <span>Groq API</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Temperatura</span>
                  <span>0.3 (Precisa)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Nome do Agente</span>
                  <span className="font-medium text-slate-800">Ágil</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lógica de Escalada</CardTitle>
              <CardDescription>Quando o agente aciona um técnico humano.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-slate-600 space-y-2">
                {[
                  "Cliente pede técnico explicitamente",
                  "Problema físico ou hardware danificado",
                  "Sistema parado afetando múltiplos usuários",
                  "Risco de perda de dados",
                  "Falha após 2 tentativas de resolução",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ── Seção Sobre ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sobre o Sistema</h2>
        </div>
        <Card className="shadow-sm border-slate-200 bg-slate-50">
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Sistema", valor: "OS Digital" },
                { label: "Backend", valor: "FastAPI + Python" },
                { label: "Frontend", valor: "React + Vite" },
                { label: "Banco", valor: "PostgreSQL 15" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-700">{item.valor}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  )
}
