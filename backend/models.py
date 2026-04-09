import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Sequence
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    razao_social = Column(String(255), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=False)
    email = Column(String(255), nullable=True)
    telefone = Column(String(50), nullable=True)
    endereco = Column(String(255), nullable=True)

    ordens_servico = relationship("OrdemServico", back_populates="cliente")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False)
    login = Column(String(255), unique=True, nullable=False)
    senha_hash =Column(String(255), nullable=False)
    cargo = Column(String(50), nullable=False)

    ordens_servico = relationship("OrdemServico", back_populates="tecnico")

class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero_os = Column(Integer, Sequence('numero_os_seq'), index=True, nullable=True)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=False)
    tecnico_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    tipo_servico = Column(String(100), nullable=False)
    solicitante = Column(String(100), nullable=False)
    setor = Column(String(100), nullable=False)
    defeito_relatado = Column(Text, nullable=False)
    descricao_servico = Column(Text, nullable=True)
    equipamento_retirado = Column(String(255), nullable=True)
    status = Column(String(50), default="aberta")
    assinatura_base64 = Column(Text, nullable=True)
    data_hora_abertura = Column(DateTime(timezone=True), server_default=func.now())
    data_hora_termino = Column(DateTime(timezone=True), nullable=True)

    cliente = relationship("Cliente", back_populates="ordens_servico")
    tecnico = relationship("Usuario")
    historico = relationship("HistoricoOS", back_populates="ordem_servico", cascade="all, delete-orphan")


# (Logo abaixo ou no final do arquivo, a classe do Histórico)
class HistoricoOS(Base):
    __tablename__ = "historico_os"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    os_id = Column(UUID(as_uuid=True), ForeignKey("ordens_servico.id"), nullable=False)
    usuario_nome = Column(String(255), nullable=False)
    descricao = Column(String(255), nullable=False)
    data_hora = Column(DateTime(timezone=True), server_default=func.now())

    # O "Aperto de mão" do Histórico de volta para a OS
    ordem_servico = relationship("OrdemServico", back_populates="historico")