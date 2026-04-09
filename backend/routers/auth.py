from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
import security
from database import get_db

router = APIRouter(prefix="/login", tags=["Autenticação"])

@router.post("/", response_model=schemas.TokenResponse)
def login(credenciais: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Busca o usuário no banco pelo login
    usuario = db.query(models.Usuario).filter(models.Usuario.login == credenciais.login).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    
    # 2. Verifica se a senha bate com o hash
    if not security.verify_password(credenciais.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    
    # 3. Gera o crachá digital (Token)
    token_data = {"sub": usuario.login, "id": str(usuario.id), "cargo": usuario.cargo}
    access_token = security.create_access_token(data=token_data)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "usuario_nome": usuario.nome,
        "usuario_cargo": usuario.cargo,
        "usuario_id": usuario.id
    }
