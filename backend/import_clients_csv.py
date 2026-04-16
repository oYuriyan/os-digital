import csv
import uuid
import os
import sys

# Ajusta o PYTHONPATH para poder importar os módulos do backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Cliente

def get_cnpj_ficticio(index):
    # Formato: 00.000.000/0001-XX
    # XX será preenchido com o índice (01 a 99)
    # Se passar de 99, vamos incrementar a parte do mil contra
    mil_contra = (index // 100) + 1
    final = index % 100
    return f"00.000.000/{mil_contra:04d}-{final:02d}"

def import_clients():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "clientes glpi.csv")
    
    if not os.path.exists(csv_path):
        print(f"Erro: Arquivo não encontrado em {csv_path}")
        return

    db = SessionLocal()
    
    try:
        with open(csv_path, mode='r', encoding='utf-8') as file:
            # O arquivo tem apenas uma coluna sem cabecalho
            lines = file.readlines()
            
            sucessos = 0
            pulados = 0
            
            for index, line in enumerate(lines, start=1):
                razao_social = line.strip()
                if not razao_social:
                    continue
                
                # Checa se ja existe
                existente = db.query(Cliente).filter(Cliente.razao_social == razao_social).first()
                if existente:
                    print(f"Cliente '{razao_social}' já existe. Pulando...")
                    pulados += 1
                    continue
                
                cnpj_ficticio = get_cnpj_ficticio(index)
                
                novo_cliente = Cliente(
                    id=uuid.uuid4(),
                    razao_social=razao_social,
                    cnpj=cnpj_ficticio,
                    endereco="Não Informado"
                )
                
                db.add(novo_cliente)
                sucessos += 1
        
        db.commit()
        print(f"Importação concluída! {sucessos} adicionados, {pulados} pulados.")

    except Exception as e:
        db.rollback()
        print(f"Erro ao importar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_clients()
