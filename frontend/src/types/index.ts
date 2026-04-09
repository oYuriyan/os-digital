export interface Cliente {
  id: string;
  razao_social: string;
  cnpj: string;
  login?: string;
  telefone?: string;
  endereco?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  cargo: string;
}

export interface HistoricoOS {
  id: string;
  usuario_nome: string;
  descricao: string;
  data_hora: string;
}

export interface OrdemServico {
  id: string;
  numero_os: number;
  cliente_id: string;
  tecnico_id: string;
  tipo_servico: string;
  solicitante: string;
  setor: string;
  defeito_relatado: string;
  descricao_servico?: string | null;
  equipamento_retirado?: string | null;
  status: string;
  assinatura_base64?: string | null;
  data_hora_abertura: string;
  data_hora_termino?: string | null;
  historico: HistoricoOS[];
  cliente?: Cliente;
  tecnico?: Usuario;
}
