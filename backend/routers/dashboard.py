from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    """Retorna métricas agregadas para o dashboard."""
    total = db.query(models.OrdemServico).count()
    abertas = db.query(models.OrdemServico).filter(models.OrdemServico.status.in_(["aberta", "em_andamento"])).count()
    concluidas = db.query(models.OrdemServico).filter(models.OrdemServico.status.in_(["fechada", "concluida", "concluída"])).count()
    total_clientes = db.query(models.Cliente).count()
    total_tecnicos = db.query(models.Usuario).count()
    return {
        "total_os": total,
        "os_abertas": abertas,
        "os_concluidas": concluidas,
        "total_clientes": total_clientes,
        "total_tecnicos": total_tecnicos,
    }
