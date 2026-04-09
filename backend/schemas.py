from pydantic import BaseModel, UUID4, Field
from typing import Optional, Dict,List
from datetime import datetime

class ClienteBase(BaseModel):
    razao_social: str
    cnpj: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    id: UUID4

    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    nome: str
    login: str
    cargo: str

class UsuarioCreate(UsuarioBase):
    senha: str

class UsuarioResponse(UsuarioBase):
    id: UUID4

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    login: str
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    usuario_nome: str
    usuario_cargo: str
    usuario_id: UUID4

class OrdemServicoBase(BaseModel):
    cliente_id: UUID4
    tecnico_id: UUID4
    tipo_servico: str
    solicitante: str
    setor: str
    defeito_relatado: str
    descricao_servico: Optional[str] = None
    equipamento_retirado: Optional[str] = None
    status: Optional[str] = "aberta"
    assinatura_base64: Optional[str] = None

class OrdemServicoCreate(OrdemServicoBase):
    pass

class HistoricoOSResponse(BaseModel):
    id: UUID4
    usuario_nome: str
    descricao: str
    data_hora: datetime
    class Config:
        from_attributes = True

class OrdemServicoResponse(OrdemServicoBase):
    id: UUID4
    numero_os: Optional[int] = None
    descricao_servico: Optional[str] = None
    equipamento_retirado: Optional[str] = None
    data_hora_abertura: Optional[datetime] = None
    data_hora_termino: Optional[datetime] = None
    status: str
    assinatura_base64: Optional[str] = None
    historico: List[HistoricoOSResponse] = []

    class Config:
        from_attributes = True

# Atualizar a OS 
class OrdemServicoUpdate(BaseModel):
    descricao_servico: Optional[str] = None
    equipamento_retirado: Optional[str] = None
    status: Optional[str] = None
    assinatura_base64: Optional[str] = None
    data_hora_termino: Optional[datetime] = None
    usuario_nome: Optional[str] = None

class UsuarioUpdateSenha(BaseModel):
    nova_senha: str

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    login: Optional[str] = None
    cargo: Optional[str] = None
