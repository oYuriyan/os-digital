from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import security
from database import get_db

router = APIRouter(prefix="/usuarios", tags=["UsuÃ¡rios"])

@router.post("/", response_model=schemas.UsuarioResponse)
def criar_usuario(
    usuario: schemas.UsuarioCreate, 
    db: Session = Depends(get_db),
    usuario_logado: dict = Depends(security.get_current_user)
):
    if "Gestor" not in usuario_logado.get("cargo", "") and "Admin" not in usuario_logado.get("cargo", ""):
        raise HTTPException(status_code=403, detail="Apenas Gestores podem criar novos usuÃ¡rios")
        
    db_usuario = db.query(models.Usuario).filter(models.Usuario.login == usuario.login).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="UsuÃ¡rio (Login) jÃ¡ cadastrado")
    
    # Criptografa a senha antes de salvar no banco
    hashed_password = security.get_password_hash(usuario.senha)
    
    # Cria o novo usuÃ¡rio sem a senha em texto puro
    novo_usuario = models.Usuario(
        nome=usuario.nome,
        login=usuario.login,
        cargo=usuario.cargo,
        senha_hash=hashed_password
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@router.get("/", response_model=List[schemas.UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario_logado: dict = Depends(security.get_current_user)
):
    usuarios = db.query(models.Usuario).all()
    return usuarios

@router.put("/{usuario_id}/senha", status_code=200)
def alterar_senha(
    usuario_id: str,
    dados_senha: schemas.UsuarioUpdateSenha,
    db: Session = Depends(get_db),
    usuario_logado: dict = Depends(security.get_current_user)
):
    if "Gestor" not in usuario_logado.get("cargo", "") and "Admin" not in usuario_logado.get("cargo", ""):
        raise HTTPException(status_code=403, detail="Apenas Gestores podem alterar senhas")
        
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="UsuÃ¡rio nÃ£o encontrado")
        
    # Salva a nova senha
    db_usuario.senha_hash = security.get_password_hash(dados_senha.nova_senha)
    db.commit()
    
    return {"message": "Senha atualizada com sucesso"}

@router.put('/{usuario_id}', response_model=schemas.UsuarioResponse)
def atualizar_usuario(
    usuario_id: str,
    usuario_update: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario_logado: dict = Depends(security.get_current_user)
):
    if 'Gestor' not in usuario_logado.get('cargo', '') and 'Admin' not in usuario_logado.get('cargo', ''):
        raise HTTPException(status_code=403, detail='Apenas Gestores podem editar usuários')
    
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail='Usuário não encontrado')
        
    if usuario_update.login and usuario_update.login != db_usuario.login:
        existe = db.query(models.Usuario).filter(models.Usuario.login == usuario_update.login).first()
        if existe:
            raise HTTPException(status_code=400, detail='Este login já está em uso')
        db_usuario.login = usuario_update.login
        
    if usuario_update.nome:
        db_usuario.nome = usuario_update.nome
    if usuario_update.cargo:
        db_usuario.cargo = usuario_update.cargo
        
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

from sqlalchemy.exc import IntegrityError
@router.delete('/{usuario_id}', status_code=204)
def deletar_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    usuario_logado: dict = Depends(security.get_current_user)
):
    if 'Gestor' not in usuario_logado.get('cargo', '') and 'Admin' not in usuario_logado.get('cargo', ''):
        raise HTTPException(status_code=403, detail='Apenas Gestores podem excluir usuários')
        
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail='Usuário não encontrado')
        
    try:
        db.delete(db_usuario)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail='Não é possível excluir este usuário pois ele possui Ordens de Serviço ou Histórico vinculados.')

