import {
  Document, Page, Text, View, Image, StyleSheet
} from "@react-pdf/renderer"

// ─── Estilos Premium (Papel Timbrado) ──────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    position: "relative",
  },

  // Marca d'Água Centralizada
  watermark: {
    position: "absolute",
    top: "25%",
    left: "20%",
    width: "60%",
    opacity: 0.08, // Bem suave, pois a logo vermelha é forte
    zIndex: -1,
  },

  // Bordas de Papel Timbrado (Sutis)
  borderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#1e3a8a", // Azul corporativo escuro
  },
  borderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#cbd5e1", // Slate 300
  },

  // Cabeçalho Profissional
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "#0f172a", // Fundo escuro para destacar a logo branca
    padding: 20,
    borderRadius: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 140, // Mais largo para comportar a logo completa
    height: 50,
    objectFit: "contain",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#60a5fa", // Azul claro
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  osNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#f8fafc", // Branco
  },
  dateInfo: {
    fontSize: 8,
    color: "#94a3b8", // Cinza claro
    marginTop: 6,
  },

  // Blocos de Informação
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#1e3a8a",
    paddingLeft: 6,
  },
  
  // Grid de Dados
  gridRow: {
    flexDirection: "row",
    marginBottom: 0,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: "#cbd5e1",
  },
  gridField: {
    flex: 1,
    padding: 8,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  label: {
    fontSize: 6.5,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 9,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },

  // Área de Texto (Relatório)
  textBox: {
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    padding: 12,
    backgroundColor: "#ffffff",
    minHeight: 60,
  },
  textValue: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#334155",
    textAlign: "justify",
  },

  // Assinaturas
  signatureContainer: {
    flexDirection: "row",
    marginTop: 40,
    paddingHorizontal: 20,
    gap: 50,
  },
  signatureBox: {
    flex: 1,
    alignItems: "center",
  },
  sigImageWrapper: {
    height: 55,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: "#475569",
    width: "100%",
    marginTop: 5,
    marginBottom: 8,
  },
  sigName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  sigSub: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 3,
  },
  sigImage: {
    maxHeight: 55,
    objectFit: "contain",
  },

  // Termo de Aceite
  termoText: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.6,
    textAlign: "justify",
    marginTop: 10,
    fontStyle: "italic",
    paddingHorizontal: 15,
  },

  // Rodapé Minimalista
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#64748b",
    letterSpacing: 0.2,
  },
})

// ─── Componentes Auxiliares ────────────────────────────────────────────────────
function fmtData(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return "—" }
}

const Field = ({ label, value, flex = 1 }: { label: string; value?: string | null; flex?: number }) => (
  <View style={[styles.gridField, { flex }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "—"}</Text>
  </View>
)

// ─── Documento Principal ───────────────────────────────────────────────────────
interface OSPdfProps {
  os: {
    id: string
    numero_os: number
    tipo_servico: string
    solicitante: string
    setor: string
    defeito_relatado: string
    descricao_servico?: string | null
    equipamento_retirado?: string | null
    status: string
    assinatura_base64?: string | null
    data_hora_abertura?: string | null
    data_hora_termino?: string | null
  }
  cliente?: {
    razao_social?: string
    cnpj?: string
    email?: string
    telefone?: string
    endereco?: string
  } | null
  tecnico?: {
    nome?: string
    cargo?: string
  } | null
}

export function OSPdfDocument({ os, cliente, tecnico }: OSPdfProps) {
  // O Vite resolve caminhos absolutos a partir da pasta public
  const logoSrc = "/logo_oficial.png";
  const watermarkSrc = "/watermark_oficial.png";

  return (
    <Document
      title={`OS-${String(os.numero_os).padStart(4, "0")} - ${cliente?.razao_social ?? ""}`}
      author="Micro Sistema Soluções"
      creator="OS Digital"
    >
      <Page size="A4" style={styles.page}>
        
        {/* Detalhes de Papel Timbrado */}
        <View style={styles.borderTop} fixed />
        <View style={styles.borderBottom} fixed />
        <Image src={watermarkSrc} style={styles.watermark} fixed />

        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={logoSrc} style={styles.logo} />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>ORDEM DE SERVIÇO</Text>
            <Text style={styles.osNumber}>Nº {String(os.numero_os).padStart(4, "0")}</Text>
            <Text style={styles.dateInfo}>Emissão: {fmtData(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Dados do Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Contratante</Text>
          <View style={styles.gridRow}>
            <Field label="Razão Social / Nome do Cliente" value={cliente?.razao_social} flex={2} />
            <Field label="CNPJ / CPF" value={cliente?.cnpj} />
          </View>
          <View style={styles.gridRow}>
            <Field label="Solicitante Autorizado" value={os.solicitante} />
            <Field label="Setor / Local" value={os.setor} />
            <Field label="Telefone de Contato" value={cliente?.telefone} />
          </View>
          <View style={[styles.gridRow, { borderBottomWidth: 0.5 }]}>
            <Field label="Endereço de Atendimento" value={cliente?.endereco} flex={1} />
          </View>
        </View>

        {/* Informações do Atendimento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes Operacionais</Text>
          <View style={styles.gridRow}>
            <Field label="Tipo de Serviço" value={os.tipo_servico} />
            <Field label="Técnico Responsável" value={tecnico?.nome} />
            <Field label="Status Atual" value={os.status.toUpperCase()} />
          </View>
          <View style={[styles.gridRow, { borderBottomWidth: 0.5 }]}>
            <Field label="Data e Hora de Abertura" value={fmtData(os.data_hora_abertura)} />
            <Field label="Data e Hora de Conclusão" value={fmtData(os.data_hora_termino)} />
          </View>
        </View>

        {/* Relatórios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico Relatado / Problema</Text>
          <View style={styles.textBox}>
            <Text style={styles.textValue}>{os.defeito_relatado || "—"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parecer Técnico e Resolução Aplicada</Text>
          <View style={styles.textBox}>
            <Text style={styles.textValue}>{os.descricao_servico || "—"}</Text>
          </View>
        </View>

        {/* Equipamento Retirado */}
        {os.equipamento_retirado && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movimentação de Ativos</Text>
            <View style={[styles.textBox, { backgroundColor: "#fffbeb" }]}>
              <Text style={[styles.textValue, { fontFamily: "Helvetica-Bold", color: "#b45309" }]}>
                Equipamento retirado das dependências do cliente para análise laboratorial:
              </Text>
              <Text style={[styles.textValue, { marginTop: 4 }]}>
                {os.equipamento_retirado}
              </Text>
            </View>
          </View>
        )}

        {/* Declaração de Aceite */}
        <Text style={styles.termoText}>
          Declaro para os devidos fins que os serviços acima descritos foram executados a contento nas dependências de minha responsabilidade. Concordo com as informações aqui prestadas e atesto a finalização deste atendimento, autorizando o encerramento da Ordem de Serviço.
        </Text>

        {/* Assinaturas */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.sigImageWrapper}>
              {os.assinatura_base64 ? (
                <Image src={os.assinatura_base64} style={styles.sigImage} />
              ) : null}
            </View>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{cliente?.razao_social || "Nome do Cliente"}</Text>
            <Text style={styles.sigSub}>Cliente Contratante</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.sigImageWrapper} />
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>MICRO SISTEMA SOLUÇÕES</Text>
            <Text style={styles.sigSub}>Depto. Técnico Operacional</Text>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Documento eletrônico oficial gerado através da Plataforma OS Digital.
          </Text>
          <Text style={styles.footerText}>
            Página 1 de 1
          </Text>
        </View>

      </Page>
    </Document>
  )
}
