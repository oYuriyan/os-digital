from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from database import engine, get_db


import security
import models
import schemas
from config import settings
from logger import logger

from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse

# Cria tabelas novas que ainda não existem (não destrói as existentes)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OS Digital API",
    description="API para gerenciamento de Ordens de Serviço",
    version="1.0.0"
)

@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request, exc):
    print("Response Validation Error:", exc.errors())
    return JSONResponse(
        status_code=500,
        content={"detail": "Response Validation Error", "errors": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Servidor online", "sistema": "OS Digital"}

from routers import clientes, usuarios, auth, dashboard, ordens, webhook_whatsapp, evolution

app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(usuarios.router)
app.include_router(dashboard.router)
app.include_router(ordens.router)
app.include_router(webhook_whatsapp.router)
app.include_router(evolution.router)