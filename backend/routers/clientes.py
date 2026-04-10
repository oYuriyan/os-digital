from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/", response_model=schemas.ClienteResponse)
def criar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.cnpj == cliente.cnpj).first()
    if db_cliente:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    novo_cliente = models.Cliente(**cliente.model_dump())
    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return novo_cliente

@router.get("/{cliente_id}", response_model=schemas.ClienteResponse)
def buscar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@router.get("/", response_model=List[schemas.ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    return clientes

@router.put("/{cliente_id}", response_model=schemas.ClienteResponse)
def atualizar_cliente(cliente_id: str, cliente_atualizado: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Se tentou atualizar o CNPJ, valida duplicidade
    if cliente_atualizado.cnpj and cliente_atualizado.cnpj != db_cliente.cnpj:
        cnpj_existente = db.query(models.Cliente).filter(models.Cliente.cnpj == cliente_atualizado.cnpj).first()
        if cnpj_existente:
             raise HTTPException(status_code=400, detail="CNPJ já está em uso por outro cliente")

    dados = cliente_atualizado.model_dump(exclude_unset=True)
    for key, value in dados.items():
        setattr(db_cliente, key, value)
        
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.delete("/{cliente_id}", status_code=204)
def deletar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
    # Validar se o cliente tem Ordens de Serviço atreladas
    tem_os = db.query(models.OrdemServico).filter(models.OrdemServico.cliente_id == cliente_id).first()
    if tem_os:
        raise HTTPException(status_code=400, detail="Não é possível excluir o cliente pois existem Ordens de Serviço atreladas a ele.")
        
    db.delete(db_cliente)
    db.commit()
    return None
