from database import SessionLocal
from models import Usuario
from security import get_password_hash

def seed_admin():
    db = SessionLocal()
    if not db.query(Usuario).filter(Usuario.login == "admin").first():
        admin = Usuario(
            nome="Administrador Chefe",
            login="admin",
            senha_hash=get_password_hash("adminad12"),
            cargo="Gestor / Admin"
        )
        db.add(admin)
        db.commit()
        print("Usuário Admin (admin) criado com a senha 'adminad12'")
    else:
        print("Admin já existe. Seed ignorado.")

if __name__ == "__main__":
    seed_admin()
