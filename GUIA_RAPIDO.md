# 🚀 Guia Rápido: OS Digital

Bem-vindo à documentação expressa de operações do **Ecossistema OS Digital**. 
Este documento contém os atalhos e comandos fundamentais para manter, iniciar e reiniciar sua infraestrutura isolada no Docker.

---

## 🛠️ Gerenciamento do Servidor (Docker)

Todo o controle da aplicação é feito através do **PowerShell** ou **CMD**. 
Certifique-se sempre de estar no diretório principal do projeto antes de rodar os comandos:
> `cd "C:\Users\Yuri Yan\Documents\os-digital"`

### 🟢 Iniciar a Aplicação
Inicia a aplicação no plano de fundo. O sistema pegará o banco de dados, o backend no Python e o frontend no React, conectando tudo silenciosamente.

```powershell
docker-compose up -d
```

### 🔄 Reconstruir e Iniciar (Rebuild)
Se você ou a equipe adicionarem **novas dependências (npm install)**, modificarem variáveis de ambiente (`.env`) ou precisarem recriar a interface do zero por modificações profundas de código:

```powershell
docker-compose up -d --build
```

### 🛑 Desligar o Sistema
Derruba de maneira limpa todos os microsserviços. Utilize isto no final do expediente ou se ocorrer algum "engasgo" de cache local na máquina, limpando a memória RAM.

```powershell
docker-compose down
```

---

## 🌐 Acessos e Links

Com o sistema rodando (status _Up_), você pode acessar a interface pelas seguintes rotas:

| Ponto de Acesso | URL | Descrição |
| :--- | :--- | :--- |
| **Computador (Local)** | `http://localhost:3000` | Endereço primário para você usar e testar pelo próprio Notebook. |
| **Celulares (Rede Local)** | `http://172.16.20.92:3000` | Endereço dinâmico da sua Placa Ethernet. Use este link nos celulares/tablets conectados ao mesmo Wi-Fi para acessar a versão mobile PWA. |
| **API do Servidor** | `http://localhost:8001/docs` | Acesso ao Swagger Interativo (Documentação do Backend em Python FastAPI). |

---

## 🔑 Credenciais Mestre

Se o banco de dados for limpo a qualquer momento, o script semente de segurança criará automaticamente o usuário gestor para o primeiro acesso:

- **E-mail:** `admin@osdigital.com`
- **Senha:** `admin123`

> ⚠️ **Aviso de Segurança**: Recomenda-se trocar a senha do Administrador ou criar seu próprio usuário pessoal através do Painel "Equipe" após o primeiro acesso.

---

## 📱 Dica Produtividade: PWA (Progressive Web App)

Para ter a experiência "UAU" nativa fora do navegador:
1. Abra a URL (pelo Celular ou Chrome do PC).
2. Vá em Configurações/Compartilhar.
3. Clique em **"Adicionar à Tela Inicial"** ou **"Instalar Aplicativo"**.

O OS Digital viverá no seu dispositivo como um aplicativo dedicado com suporte dinâmico a rotas.
