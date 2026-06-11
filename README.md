# Trippi Project

Projeto da disciplina de Sistemas Distribuidos com foco em planejamento e acompanhamento de viagens.

## Overview

O repositorio esta organizado em dois modulos:

- `trippi-frontend/`: aplicacao web em React + TypeScript (Vite).
- `trippi-backend/`: servico backend em Python.

## Tecnologias

- Frontend: React 19, TypeScript, Vite, React Router, Zustand, Axios, Framer Motion, Lucide React, Socket.IO Client
- Backend: FastAPI, Uvicorn, SQLAlchemy, Psycopg2, Python Dotenv, Pydantic, python-socketio

## Pre-requisitos

Instale na sua maquina:

- Node.js (recomendado: versao LTS 20+)
- npm (normalmente vem junto com o Node.js)
- Python 3.11+ 
- pip

Para verificar:

```bash
node -v
npm -v
python --version
pip --version
```

## Como rodar o backend

1. Entre na pasta do backend:

```bash
cd trippi-backend
```

2. Crie e ative um ambiente virtual:

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Instale as dependencias:

```bash
pip install -r requirements.txt
```

4. Crie um arquivo `.env` dentro de `trippi-backend/` com a conexao do banco:

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

5. Rode a API:

```bash
uvicorn app.main:socket_app --reload
```

6. Acesse a aplicacao e a documentacao:

```text
API: http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs
```

## Como rodar o frontend

1. Entre na pasta do frontend:

```bash
cd trippi-frontend
```

2. Instale as dependencias:

```bash
npm install
```

3. Rode o servidor de desenvolvimento:

```bash
npm run dev
```

4. Abra a URL exibida no terminal (normalmente):

```text
http://localhost:5173
```

## Scripts uteis

### Backend

Dentro de `trippi-backend/`:

- `uvicorn app.main:socket_app --reload`: inicia a API em modo de desenvolvimento.

### Frontend

Dentro de `trippi-frontend/`:

- `npm run dev`: inicia ambiente de desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run preview`: sobe preview local da build.
- `npm run lint`: executa lint do projeto.