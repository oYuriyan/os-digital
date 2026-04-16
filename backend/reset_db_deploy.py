import sys
import os

# Permitir importe do restante do backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Usuario, OrdemServico, HistoricoOS
from security import get_password_hash

def run_reset():
    db = SessionLocal()
    try:
        # 1. Apagar todo Histórico de OS
        registros_historico = db.query(HistoricoOS).delete()
        
        # 2. Apagar todas as Ordens de Serviço
        registros_os = db.query(OrdemServico).delete()
        
        # 3. Apagar todos os usuários (exceto 'admin')
        registros_usuarios = db.query(Usuario).filter(Usuario.login != "admin").delete()
        
        # 4. Assegurar que 'admin' existe e corrigir a senha
        admin_user = db.query(Usuario).filter(Usuario.login == "admin").first()
        if admin_user:
            admin_user.senha_hash = get_password_hash("adminad12")
            print("Senha do 'admin' redefinida com sucesso para 'adminad12'")
        else:
            print("Usuário 'admin' não encontrado. Recriando...")
            novo_admin = Usuario(
                nome="Administrador Chefe",
                login="admin",
                senha_hash=get_password_hash("adminad12"),
                cargo="Gestor / Admin"
            )
            db.add(novo_admin)
        
        db.commit()
        print(f"Limpeza de Deploy concluída!")
        print(f"- {registros_historico} históricos deletados.")
        print(f"- {registros_os} OS deletadas.")
        print(f"- {registros_usuarios} usuários secundários deletados.")
        print(f"- Clientes foram preservados.")
        
    except Exception as e:
        db.rollback()
        print(f"Erro ao limpar o banco: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Iniciando limpeza pre-deploy...")
    run_reset()
