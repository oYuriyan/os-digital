import sys
import os
from loguru import logger

# Garante que a pasta de logs exista
os.makedirs("logs", exist_ok=True)

# Remove o handler padrão para evitar duplicações
logger.remove()

# Configuração para saída no terminal (stdout) com cores
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# Configuração para salvar em arquivo
logger.add(
    "logs/app.log",
    rotation="10 MB",     # Rotação de arquivo a cada 10 MB
    retention="10 days",  # Mantém arquivos por até 10 dias
    level="INFO",         # Registra a partir do nível INFO
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
)
