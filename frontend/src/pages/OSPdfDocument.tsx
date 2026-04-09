import {
  Document, Page, Text, View, Image, StyleSheet
} from "@react-pdf/renderer"

// ─── Estilos ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 0,
    fontFamily: "Helvetica",
  },

  // Faixa de cabeçalho
  header: {
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 56,
    height: 42,
    objectFit: "contain",
  },
  headerCompany: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  headerSlogan: {
    color: "#94a3b8",
    fontSize: 7.5,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerBadge: {
    backgroundColor: "#1e3a5f",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  headerBadgeText: {
    color: "#93c5fd",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerNumOS: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  headerData: {
    color: "#94a3b8",
    fontSize: 7.5,
    marginTop: 2,
  },

  // Faixa azul de destaque
  statusBar: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 28,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statusValue: {
    color: "#bfdbfe",
    fontSize: 8,
    letterSpacing: 0.5,
  },

  // Corpo
  body: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 0,
  },

  // Seção
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
    paddingBottom: 4,
  },

  // Grid de campos
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 0,
  },
  field: {
    flex: 1,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 6.5,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 9,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  fieldBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    padding: 6,
  },

  // Campo de texto longo
  textareaBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    padding: 8,
    minHeight: 52,
  },
  textareaValue: {
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.5,
  },

  // Equipamento retirado (destaque)
  equipBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 3,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  equipLabel: {
    fontSize: 6.5,
    color: "#9a3412",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  equipValue: {
    fontSize: 9,
    color: "#7c2d12",
    fontFamily: "Helvetica-Bold",
  },

  // Bloco de assinaturas
  signaturesRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    marginBottom: 14,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  signatureHeader: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  signatureHeaderText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  signatureBody: {
    padding: 8,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  signatureImage: {
    maxWidth: 180,
    maxHeight: 64,
    objectFit: "contain",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    borderTopStyle: "dashed",
    marginTop: 10,
    width: "100%",
  },
  signatureNameText: {
    fontSize: 8,
    color: "#334155",
    marginTop: 4,
    textAlign: "center",
  },
  signaturePlaceholder: {
    height: 52,
    width: "80%",
    borderBottomWidth: 1.5,
    borderBottomColor: "#334155",
    marginTop: 20,
  },
  companySigText: {
    fontSize: 8,
    color: "#1e40af",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 6,
  },

  // Termo de aceite
  termoBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 3,
    padding: 8,
    marginBottom: 10,
  },
  termoText: {
    fontSize: 7.5,
    color: "#166534",
    lineHeight: 1.5,
    textAlign: "justify",
  },

  // Rodapé
  footer: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    color: "#94a3b8",
    fontSize: 6.5,
    lineHeight: 1.6,
  },
  footerBold: {
    color: "#e2e8f0",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerOS: {
    color: "#60a5fa",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  footerStatus: {
    color: "#6ee7b7",
    fontSize: 7,
    marginTop: 2,
  },
})

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtData(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return "—" }
}

function Campo({ label, value, flex = 1 }: { label: string; value?: string | null; flex?: number }) {
  return (
    <View style={[styles.field, { flex }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <Text style={styles.fieldValue}>{value || "—"}</Text>
      </View>
    </View>
  )
}

// ─── Documento PDF ─────────────────────────────────────────────────────────────
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
  const logoSrc = "/logo.png"

  return (
    <Document
      title={`OS-${os.numero_os} - ${cliente?.razao_social ?? ""}`}
      author="Micro Sistema Soluções"
      creator="OS Digital"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={logoSrc} style={styles.logo} />
            <View>
              <Text style={styles.headerCompany}>Micro Sistema Soluções</Text>
              <Text style={styles.headerSlogan}>Tecnologia e Suporte Técnico Especializado</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>ORDEM DE SERVIÇO</Text>
            </View>
            <Text style={styles.headerNumOS}>#{String(os.numero_os).padStart(4, "0")}</Text>
            <Text style={styles.headerData}>Abertura: {fmtData(os.data_hora_abertura)}</Text>
          </View>
        </View>

        {/* ── Status Bar ────────────────────────────────────────────────────── */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>Tipo de Serviço</Text>
          <Text style={styles.statusValue}>{os.tipo_servico}</Text>
          <Text style={styles.statusText}>Técnico Responsável</Text>
          <Text style={styles.statusValue}>{tecnico?.nome ?? "—"}</Text>
          <Text style={styles.statusText}>Status</Text>
          <Text style={styles.statusValue}>
            {os.status === "fechada" || os.status === "concluida" ? "CONCLUÍDA" : os.status.toUpperCase()}
          </Text>
        </View>

        {/* ── Corpo ─────────────────────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* Dados do Cliente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados do Contratante</Text>
            <View style={styles.row}>
              <Campo label="Razão Social" value={cliente?.razao_social} flex={2} />
              <Campo label="CNPJ" value={cliente?.cnpj} />
            </View>
            <View style={styles.row}>
              <Campo label="E-mail" value={cliente?.email} />
              <Campo label="Telefone / WhatsApp" value={cliente?.telefone} />
              <Campo label="Endereço" value={cliente?.endereco} flex={2} />
            </View>
          </View>

          {/* Dados do Atendimento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados do Atendimento</Text>
            <View style={styles.row}>
              <Campo label="Solicitante" value={os.solicitante} />
              <Campo label="Setor / Departamento" value={os.setor} />
              <Campo label="Data de Abertura" value={fmtData(os.data_hora_abertura)} />
              <Campo label="Data de Conclusão" value={fmtData(os.data_hora_termino)} />
            </View>
          </View>

          {/* Defeito Relatado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Defeito / Problema Relatado</Text>
            <View style={styles.textareaBox}>
              <Text style={styles.textareaValue}>{os.defeito_relatado || "—"}</Text>
            </View>
          </View>

          {/* Descrição do Serviço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solução / Serviço Realizado</Text>
            <View style={styles.textareaBox}>
              <Text style={styles.textareaValue}>{os.descricao_servico || "—"}</Text>
            </View>
          </View>

          {/* Equipamento Retirado */}
          {os.equipamento_retirado ? (
            <View style={styles.equipBox}>
              <View>
                <Text style={styles.equipLabel}>Equipamento Retirado das Dependências</Text>
                <Text style={styles.equipValue}>{os.equipamento_retirado}</Text>
              </View>
            </View>
          ) : null}

          {/* Termo de Aceite */}
          <View style={styles.termoBox}>
            <Text style={styles.termoText}>
              TERMO DE ACEITE: O cliente atesta que o serviço descrito acima foi executado de forma satisfatória nas dependências de{" "}
              {cliente?.razao_social ?? "____________________________"}, declarando ciência das atividades realizadas e autorizando o prestador Micro Sistema Soluções a dar baixa na presente Ordem de Serviço.
            </Text>
          </View>

          {/* Assinaturas */}
          <View style={styles.signaturesRow}>
            {/* Assinatura do Cliente */}
            <View style={styles.signatureBox}>
              <View style={styles.signatureHeader}>
                <Text style={styles.signatureHeaderText}>Assinatura do Contratante</Text>
              </View>
              <View style={styles.signatureBody}>
                {os.assinatura_base64 ? (
                  <Image src={os.assinatura_base64} style={styles.signatureImage} />
                ) : (
                  <View style={styles.signaturePlaceholder} />
                )}
                <Text style={styles.signatureNameText}>{cliente?.razao_social ?? "____________________________"}</Text>
                <Text style={[styles.signatureNameText, { color: "#94a3b8", fontSize: 7 }]}>
                  {os.solicitante} · {os.setor}
                </Text>
              </View>
            </View>

            {/* Assinatura da Empresa Prestadora */}
            <View style={styles.signatureBox}>
              <View style={styles.signatureHeader}>
                <Text style={styles.signatureHeaderText}>Assinatura do Prestador</Text>
              </View>
              <View style={styles.signatureBody}>
                <View style={styles.signaturePlaceholder} />
                <Text style={styles.companySigText}>Micro Sistema Soluções</Text>
                <Text style={[styles.signatureNameText, { color: "#64748b", fontSize: 7 }]}>
                  {tecnico?.nome} · {tecnico?.cargo ?? "Técnico Responsável"}
                </Text>
              </View>
            </View>
          </View>

        </View>

        {/* ── Rodapé ────────────────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerBold}>Micro Sistema Soluções</Text>
            <Text style={styles.footerText}>
              Documento gerado digitalmente via OS Digital · {fmtData(new Date().toISOString())}
            </Text>
            <Text style={styles.footerText}>
              Este documento possui validade jurídica mediante assinatura de ambas as partes.
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerOS}>OS #{String(os.numero_os).padStart(4, "0")}</Text>
            <Text style={styles.footerStatus}>
              {os.data_hora_termino ? `Concluída em ${fmtData(os.data_hora_termino)}` : "Em Andamento"}
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
