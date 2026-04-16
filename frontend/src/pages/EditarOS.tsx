import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import SignatureCanvas from "react-signature-canvas"
import { toast } from "sonner"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { OSPdfDocument } from "./OSPdfDocument"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, CheckCircle, Loader2, Save, Trash2,
  Building2, User, Lock, Clock, Download, Mail,
  MessageCircle, FileCheck2
} from "lucide-react"
import { api } from "@/services/api"

export function EditarOS() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sigCanvas = useRef<SignatureCanvas>(null)

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [osOriginal, setOsOriginal] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [tecnico, setTecnico] = useState<any>(null)

  const [formData, setFormData] = useState({
    descricao_servico: "",
    status: "",
    assinatura_base64: ""
  })

  const osTrancada = osOriginal?.status === "fechada" || osOriginal?.status === "concluida"

  useEffect(() => {
    async function carregarDados() {
      try {
        const resOS = await api.get(`/os/${id}`)
        setOsOriginal(resOS.data)
        setFormData({
          descricao_servico: resOS.data.descricao_servico || "",
          status: resOS.data.status || "aberta",
          assinatura_base64: resOS.data.assinatura_base64 || ""
        })

        const [resCliente, resTecnico] = await Promise.all([
          resOS.data.cliente_id ? api.get(`/clientes/${resOS.data.cliente_id}`) : Promise.resolve({ data: null }),
          api.get("/usuarios/"),
        ])
        setCliente(resCliente.data)
        const tecnicos = resTecnico.data
        const t = tecnicos.find((u: any) => u.id === resOS.data.tecnico_id)
        setTecnico(t || null)
      } catch (error) {
        toast.error("Erro de conexão", { description: "Não foi possível carregar esta OS." })
        navigate("/os")
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [id, navigate])

  const handleDelete = async () => {
    try {
      await api.delete(`/os/${id}`)
      toast.success("OS Excluída")
      navigate("/os")
    } catch {
      toast.error("Erro ao excluir OS.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const mudouAlgo = formData.descricao_servico !== osOriginal.descricao_servico ||
                      formData.status !== osOriginal.status;

    if (osTrancada && !mudouAlgo) {
      toast.info("Atenção", { description: "Nenhuma modificação foi feita." })
      return
    }

    setSalvando(true)
    try {
      let dadosParaEnviar = {
        ...formData,
        usuario_nome: localStorage.getItem("usuario_nome")
      }

      if (formData.status === "fechada") {
        if (!osTrancada) {
          if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            toast.warning("Assinatura Obrigatória", { description: "O cliente precisa assinar para finalizar." })
            setSalvando(false)
            return
          }
          dadosParaEnviar.assinatura_base64 = sigCanvas.current.getCanvas().toDataURL("image/png")
        }
        // Se ela já estiver trancada (fechada original), e continua fechada,
        // não precisa validar nova assinatura, mantém a original.
      } else {
        delete (dadosParaEnviar as any).assinatura_base64
      }

      await api.put(`/os/${id}`, dadosParaEnviar)
      toast.success(
        formData.status === "fechada" ? "Atendimento Finalizado!" : "Progresso Salvo",
        { description: formData.status === "fechada" ? "O PDF já está disponível para download." : undefined }
      )
      window.location.reload()

    } catch (error) {
      toast.error("Erro ao salvar a OS.")
    } finally {
      setSalvando(false)
    }
  }

  // ── Ações de compartilhamento ─────────────────────────────────────────────────
  const handleEmail = () => {
    const assunto = encodeURIComponent(`OS #${String(osOriginal?.numero_os).padStart(4, "0")} - Conclusão de Atendimento`)
    const corpo = encodeURIComponent(
      `Prezados,\n\nInformamos que a Ordem de Serviço #${String(osOriginal?.numero_os).padStart(4, "0")} foi concluída com sucesso.\n\n` +
      `Cliente: ${cliente?.razao_social ?? ""}\n` +
      `Solicitante: ${osOriginal?.solicitante}\n` +
      `Setor: ${osOriginal?.setor}\n` +
      `Serviço: ${osOriginal?.tipo_servico}\n` +
      `Técnico: ${tecnico?.nome ?? ""}\n\n` +
      `Serviço Realizado:\n${osOriginal?.descricao_servico ?? ""}\n\n` +
      `Em anexo segue o relatório completo em PDF.\n\nAtenciosamente,\nMicro Sistema Soluções`
    )
    const destinatario = encodeURIComponent(cliente?.email ?? "")
    window.open(`mailto:${destinatario}?subject=${assunto}&body=${corpo}`)
  }

  const handleWhatsAppCliente = () => {
    const foneRaw = cliente?.telefone?.replace(/\D/g, "") ?? ""
    if (!foneRaw) {
      toast.warning("Telefone não cadastrado", { description: "Este cliente não possui telefone." })
      return
    }
    const fone = foneRaw.startsWith("55") ? foneRaw : `55${foneRaw}`

    const msg = encodeURIComponent(
      `Olá! A *Ordem de Serviço #${String(osOriginal?.numero_os).padStart(4, "0")}* foi concluída com sucesso.\n\n` +
      `*Cliente:* ${cliente?.razao_social ?? ""}\n` +
      `*Serviço:* ${osOriginal?.tipo_servico}\n` +
      `*Técnico:* ${tecnico?.nome ?? ""}\n\n` +
      `Serviço realizado:\n_${osOriginal?.descricao_servico ?? ""}_\n\n` +
      `Em breve enviaremos também o PDF do relatório assinado.\n\n` +
      `Atenciosamente, *Micro Sistema Soluções*`
    )
    window.open(`https://wa.me/${fone}?text=${msg}`, "_blank")
  }

  const handleWhatsAppEmpresa = () => {
    // Número padrão da empresa (pode ser ajustado posteriormente)
    const foneEmpresa = "5511999999999" 
    
    // Mensagem interna formatada para a Gestão
    const msg = encodeURIComponent(
      `*NOVA OS CONCLUÍDA - #${String(osOriginal?.numero_os).padStart(4, "0")}*\n\n` +
      `👔 *Cliente:* ${cliente?.razao_social ?? ""}\n` +
      `🛠️ *Serviço:* ${osOriginal?.tipo_servico}\n` +
      `🧑‍🔧 *Técnico:* ${tecnico?.nome ?? ""}\n\n` +
      `*Resumo do Fechamento:*\n${osOriginal?.descricao_servico ?? ""}\n\n` +
      `Relatório em anexo na plataforma Web.`
    )
    window.open(`https://wa.me/${foneEmpresa}?text=${msg}`, "_blank")
  }

  if (carregando) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-slate-500" />
    </div>
  )

  const nomeArquivoPdf = `OS-${String(osOriginal?.numero_os).padStart(4, "0")}-${(cliente?.razao_social ?? "cliente").replace(/\s+/g, "_")}.pdf`

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/os")} className="bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">OS #{String(osOriginal?.numero_os).padStart(4, "0")}</h1>
              {osTrancada && (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                  <Lock className="w-3 h-3 mr-1" /> Documento Trancado
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">Gestão e Validação de Atendimento</p>
          </div>
        </div>

        {!osTrancada && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir OS
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação apagará permanentemente a OS.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600">Sim, Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* ── Painel de Ações pós-conclusão ──────────────────────────────────────── */}
      {osTrancada && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <FileCheck2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-800">Atendimento Concluído</h3>
              <p className="text-xs text-emerald-600">Baixe o relatório ou compartilhe com o cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Baixar PDF */}
            <PDFDownloadLink
              document={
                <OSPdfDocument
                  os={{
                    ...osOriginal,
                    assinatura_base64: osOriginal?.assinatura_base64,
                  }}
                  cliente={cliente}
                  tecnico={tecnico}
                />
              }
              fileName={nomeArquivoPdf}
              className="no-underline"
            >
              {({ loading }) => (
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-700 text-white gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {loading ? "Gerando PDF..." : "Baixar PDF"}
                </Button>
              )}
            </PDFDownloadLink>

            {/* Enviar por E-mail */}
            <Button
              variant="outline"
              className="w-full border-slate-300 text-slate-700 hover:bg-white gap-2"
              onClick={handleEmail}
            >
              <Mail className="h-4 w-4 text-blue-500" />
              Enviar por E-mail
            </Button>

            {/* Enviar WhatsApp Cliente */}
            <Button
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50 gap-2"
              onClick={handleWhatsAppCliente}
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              WA Cliente
            </Button>

            {/* Enviar WhatsApp Empresa */}
            <Button
              variant="outline"
              className="w-full border-emerald-200 text-emerald-800 hover:bg-emerald-50 gap-2"
              onClick={handleWhatsAppEmpresa}
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              WA Empresa
            </Button>
          </div>
        </div>
      )}

      {/* ── Grid principal ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna Esquerda: Resumo e Auditoria */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-50 border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Dados do Contratante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">{cliente?.razao_social}</p>
                <p>CNPJ: {cliente?.cnpj}</p>
              </div>
              {cliente?.telefone && (
                <p className="text-xs text-slate-500">📞 {cliente.telefone}</p>
              )}
              {cliente?.email && (
                <p className="text-xs text-slate-500">✉ {cliente.email}</p>
              )}
              <div className="pt-2 border-t border-slate-200">
                <p className="flex items-center gap-2 font-medium text-slate-900 mt-2">
                  <User className="h-4 w-4 text-slate-400" />
                  {osOriginal?.solicitante}
                </p>
                <p className="ml-6 text-xs">{osOriginal?.setor}</p>
              </div>

              {/* Destaque do problema relatado */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Problema Relatado / Motivo</span>
                <p className="text-sm font-medium text-slate-800 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 whitespace-pre-wrap">
                  {osOriginal?.defeito_relatado || "Nenhum problema detalhado."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline de Auditoria */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-3 bg-slate-50">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                <Clock className="h-4 w-4" /> Histórico de Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-64 overflow-y-auto">
              <div className="space-y-4">
                {osOriginal?.historico?.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center">Nenhuma alteração registrada.</p>
                ) : (
                  osOriginal?.historico?.map((hist: any) => (
                    <div key={hist.id} className="relative pl-4 border-l-2 border-slate-200">
                      <div className="absolute w-2 h-2 bg-slate-400 rounded-full -left-[5px] top-1.5 ring-4 ring-white" />
                      <p className="text-xs font-semibold text-slate-900">{hist.usuario_nome}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{hist.descricao}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(hist.data_hora).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>{osTrancada ? "Relatório Final Aprovado" : "Resolução e Fechamento"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-2">
                  <Label>Status da Operação</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger className="w-full md:w-1/2 bg-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="fechada">Concluída (Fechada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Relatório de Solução Técnica</Label>
                  <Textarea
                    required
                    className="min-h-[140px] bg-white resize-none"
                    placeholder="Descreva detalhadamente o que foi realizado..."
                    value={formData.descricao_servico}
                    onChange={(e) => setFormData({ ...formData, descricao_servico: e.target.value })}
                  />
                </div>

                {/* Assinatura */}
                {(formData.status === "fechada" || osTrancada) && (
                  <div className="space-y-4 p-5 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="text-xs text-slate-500 text-justify leading-relaxed">
                      <strong>TERMO DE ACEITE:</strong> O cliente atesta que o serviço descrito acima foi
                      concluído de forma satisfatória nas premissas da {cliente?.razao_social}.
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">Assinatura do Cliente</Label>

                      {osTrancada ? (
                        <div className="bg-white border border-slate-200 rounded-md p-2 flex justify-center">
                          <img
                            src={osOriginal.assinatura_base64}
                            alt="Assinatura do Cliente"
                            className="h-32 object-contain"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="bg-white border-2 border-dashed border-slate-300 rounded-md overflow-hidden focus-within:border-blue-500">
                            <SignatureCanvas
                              ref={sigCanvas}
                              penColor="black"
                              minWidth={1.5}
                              maxWidth={3.5}
                              velocityFilterWeight={0.7}
                              canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => sigCanvas.current?.clear()}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
                          >
                            Limpar assinatura
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                  <Button
                    type="submit"
                    disabled={salvando}
                    className={`w-full py-6 text-lg transition-all ${
                      formData.status === "fechada" || osTrancada
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {salvando
                      ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      : formData.status === "fechada" || osTrancada
                        ? <CheckCircle className="mr-2 h-5 w-5" />
                        : <Save className="mr-2 h-5 w-5" />
                    }
                    {osTrancada 
                      ? "Salvar Modificação Pós-Conclusão"
                      : formData.status === "fechada"
                        ? "Coletar Assinatura e Finalizar"
                        : "Salvar Andamento Técnico"
                    }
                  </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}