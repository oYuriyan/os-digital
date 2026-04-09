import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Plus, FileText, CheckCircle, Clock, TrendingUp,
  Users, AlertCircle, Timer, ArrowRight, Loader2,
  BarChart2, CalendarDays, RefreshCw
} from "lucide-react"
import { api } from "@/services/api"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts"
import { format, subDays, isWithinInterval, startOfDay, endOfDay, differenceInMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"

// ─── Types ────────────────────────────────────────────────────────────────────
interface OS {
  id: string
  numero_os: number
  cliente_id: string
  tecnico_id: string
  tipo_servico: string
  status: string
  data_hora_abertura: string
  data_hora_termino: string | null
}
interface Cliente {
  id: string
  razao_social: string
}
interface Usuario {
  id: string
  nome: string
  cargo: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  fechada: "Concluída",
  concluida: "Concluída",
  "concluída": "Concluída",
}


// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconColor?: string
  trend?: { value: number; positive: boolean }
}
function KpiCard({ title, value, sub, icon: Icon, iconColor = "text-slate-400", trend }: KpiProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-500"}`}>
          <TrendingUp className={`h-3 w-3 ${!trend.positive ? "rotate-180" : ""}`} />
          {trend.positive ? "+" : ""}{trend.value}% vs. período anterior
        </div>
      )}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-slate-400" />
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">{title}</h3>
    </div>
  )
}

// ─── Período Selector ─────────────────────────────────────────────────────────
type Periodo = "7d" | "30d" | "90d"
const PERIODOS: { label: string; value: Periodo }[] = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
]

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate()
  const [ordens, setOrdens] = useState<OS[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>("30d")
  const [atualizando, setAtualizando] = useState(false)

  const carregarDados = async (silencioso = false) => {
    if (!silencioso) setCarregando(true)
    else setAtualizando(true)
    try {
      const [resOs, resClientes, resTecnicos] = await Promise.all([
        api.get("/os/"),
        api.get("/clientes/"),
        api.get("/usuarios/"),
      ])
      setOrdens(resOs.data)
      setClientes(resClientes.data)
      setTecnicos(resTecnicos.data)
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.clear()
        navigate("/login")
      }
    } finally {
      setCarregando(false)
      setAtualizando(false)
    }
  }

  useEffect(() => {
    async function carregarDashboard() {
      await carregarDados()
    }
    carregarDashboard()
  }, [])

  // ── Filter by period ──────────────────────────────────────────────────────
  const diasAtras = periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90
  const ordensFiltradas = useMemo(() => {
    const inicio = startOfDay(subDays(new Date(), diasAtras))
    const fim = endOfDay(new Date())
    return ordens.filter(os => {
      const data = new Date(os.data_hora_abertura)
      return isWithinInterval(data, { start: inicio, end: fim })
    })
  }, [ordens, diasAtras])

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const totalOs = ordensFiltradas.length
  const osAbertas = ordensFiltradas.filter(os => ["aberta", "em_andamento"].includes(os.status)).length
  const osConcluidas = ordensFiltradas.filter(os => ["fechada", "concluida", "concluída"].includes(os.status)).length
  const taxaConclusao = totalOs > 0 ? Math.round((osConcluidas / totalOs) * 100) : 0

  // Tempo médio de atendimento (em horas)
  const tempoMedioHoras = useMemo(() => {
    const concluidas = ordensFiltradas.filter(os =>
      os.data_hora_termino && ["fechada", "concluida", "concluída"].includes(os.status)
    )
    if (!concluidas.length) return null
    const totalMin = concluidas.reduce((acc, os) => {
      return acc + differenceInMinutes(new Date(os.data_hora_termino!), new Date(os.data_hora_abertura))
    }, 0)
    const mediaMin = totalMin / concluidas.length
    if (mediaMin < 60) return `${Math.round(mediaMin)} min`
    return `${(mediaMin / 60).toFixed(1)} h`
  }, [ordensFiltradas])

  // ── Gráfico 1: OS por status (Pie) ───────────────────────────────────────
  const dadosPizza = useMemo(() => {
    const grupos: Record<string, number> = {}
    ordensFiltradas.forEach(os => {
      const label = STATUS_LABEL[os.status] || os.status
      grupos[label] = (grupos[label] || 0) + 1
    })
    return Object.entries(grupos).map(([name, value]) => ({ name, value }))
  }, [ordensFiltradas])

  const CORES_PIZZA = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"]

  // ── Gráfico 2: OS por dia (Line/Area) ────────────────────────────────────
  const dadosDiario = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (let i = diasAtras - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "dd/MM", { locale: ptBR })
      mapa[d] = 0
    }
    ordensFiltradas.forEach(os => {
      const d = format(new Date(os.data_hora_abertura), "dd/MM", { locale: ptBR })
      if (d in mapa) mapa[d]++
    })
    return Object.entries(mapa).map(([data, total]) => ({ data, total }))
  }, [ordensFiltradas, diasAtras])

  // ── Gráfico 3: Ranking de técnicos ───────────────────────────────────────
  const rankingTecnicos = useMemo(() => {
    const mapa: Record<string, number> = {}
    ordensFiltradas.forEach(os => {
      mapa[os.tecnico_id] = (mapa[os.tecnico_id] || 0) + 1
    })
    return Object.entries(mapa)
      .map(([id, total]) => ({
        nome: tecnicos.find(t => t.id === id)?.nome?.split(" ")[0] ?? "—",
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [ordensFiltradas, tecnicos])

  // ── Gráfico 4: OS por tipo de serviço (Bar) ───────────────────────────────
  const dadosTipo = useMemo(() => {
    const mapa: Record<string, number> = {}
    ordensFiltradas.forEach(os => {
      mapa[os.tipo_servico] = (mapa[os.tipo_servico] || 0) + 1
    })
    return Object.entries(mapa)
      .map(([tipo, total]) => ({ tipo: tipo.split(" ").slice(0, 2).join(" "), total }))
      .sort((a, b) => b.total - a.total)
  }, [ordensFiltradas])

  // ── Últimas OS ────────────────────────────────────────────────────────────
  const ultimasOS = useMemo(() =>
    [...ordensFiltradas]
      .sort((a, b) => new Date(b.data_hora_abertura).getTime() - new Date(a.data_hora_abertura).getTime())
      .slice(0, 8),
    [ordensFiltradas]
  )

  const getNomeCliente = (id: string) => clientes.find(c => c.id === id)?.razao_social ?? "—"
  const getNomeTecnico = (id: string) => tecnicos.find(t => t.id === id)?.nome?.split(" ")[0] ?? "—"

  if (carregando) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">Carregando painel...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Operacional</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Visão geral dos atendimentos ·{" "}
            <span className="text-slate-700 font-medium">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Seletor de período */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5">
            {PERIODOS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  periodo === p.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => carregarDados(true)}
            disabled={atualizando}
            className="h-9 w-9 border-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => navigate("/os/nova")}
            className="bg-slate-900 hover:bg-slate-700 text-white h-9 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova OS
          </Button>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total de OS"
          value={totalOs}
          sub={`nos últimos ${diasAtras} dias`}
          icon={FileText}
          iconColor="text-slate-400"
        />
        <KpiCard
          title="Em Aberto"
          value={osAbertas}
          sub="aguardando atendimento"
          icon={Clock}
          iconColor="text-amber-500"
        />
        <KpiCard
          title="Concluídas"
          value={osConcluidas}
          sub={`${taxaConclusao}% de taxa de conclusão`}
          icon={CheckCircle}
          iconColor="text-emerald-500"
        />
        <KpiCard
          title="Tempo Médio"
          value={tempoMedioHoras ?? "—"}
          sub="por atendimento concluído"
          icon={Timer}
          iconColor="text-blue-500"
        />
      </div>

      {/* ── Gráficos — Row 1 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Evolução diária */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <SectionTitle icon={BarChart2} title="Evolução de Atendimentos" />
          {dadosDiario.length === 0 || dadosDiario.every(d => d.total === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              Nenhum dado no período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dadosDiario} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-os" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="data"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={diasAtras === 7 ? 0 : diasAtras === 30 ? 4 : 13}
                />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="OS abertas" stroke="#3b82f6" fill="url(#grad-os)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pizza de status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <SectionTitle icon={AlertCircle} title="OS por Status" />
          {dadosPizza.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Sem dados.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dadosPizza.map((_, index) => (
                    <Cell key={index} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", color: "#64748b" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Gráficos — Row 2 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ranking de técnicos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <SectionTitle icon={Users} title="Ranking de Técnicos" />
          {rankingTecnicos.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Sem dados.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rankingTecnicos} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="OS Atendidas" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tipos de serviço */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <SectionTitle icon={FileText} title="Serviços Mais Solicitados" />
          {dadosTipo.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Sem dados.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosTipo} margin={{ top: 4, right: 8, left: -20, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="tipo"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Quantidade" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Últimas OS ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Atendimentos Recentes</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/os")}
            className="text-xs text-slate-500 hover:text-slate-900 -mr-2"
          >
            Ver todas <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="divide-y divide-slate-50">
          {ultimasOS.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Nenhuma OS registrada no período selecionado.
            </div>
          ) : (
            ultimasOS.map(os => {
              const statusKey = os.status.toLowerCase()
              const isConcluida = ["fechada", "concluida", "concluída"].includes(statusKey)
              return (
                <div
                  key={os.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/os/editar/${os.id}`)}
                >
                  {/* Número */}
                  <span className="font-mono text-xs font-semibold text-slate-400 w-10 shrink-0">
                    #{os.numero_os}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{getNomeCliente(os.cliente_id)}</p>
                    <p className="text-xs text-slate-500 truncate">{os.tipo_servico} · {getNomeTecnico(os.tecnico_id)}</p>
                  </div>

                  {/* Data */}
                  <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                    {format(new Date(os.data_hora_abertura), "dd/MM HH:mm")}
                  </span>

                  {/* Badge */}
                  <div className="shrink-0">
                    {statusKey === "aberta" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Aberta
                      </span>
                    )}
                    {statusKey === "em_andamento" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Em Andamento
                      </span>
                    )}
                    {isConcluida && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        Concluída
                      </span>
                    )}
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}