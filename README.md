# Trippi Project

Projeto da disciplina de Sistemas Distribuidos com foco em planejamento, organizacao e acompanhamento de viagens em grupo.

## Visao geral

O repositorio esta dividido em dois modulos principais:

- `trippi-frontend/`: aplicacao web em React + TypeScript.
- `trippi-backend/`: API em FastAPI com integracao WebSocket via Socket.IO.

Hoje o sistema cobre fluxos de autenticacao, viagens, membros, roteiro e financeiro, com frontend consumindo a API REST e eventos em tempo real.

## Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Zustand
- Framer Motion
- Lucide React
- Socket.IO Client

### Backend

- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL via `psycopg2-binary`
- Pydantic
- Python Dotenv
- JWT com `python-jose`
- Password hashing com `passlib`
- Socket.IO ASGI

## Estrutura do projeto

```text
.
|-- trippi-backend/
|   |-- app/
|   |   |-- core/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- schemas/
|   |   `-- services/
|   `-- requirements.txt
`-- trippi-frontend/
	|-- public/
	`-- src/
		|-- components/
		|-- contexts/
		|-- layouts/
		|-- pages/
		|-- routes/
		|-- services/
		|-- store/
		|-- styles/
		`-- types/
```

## Pre-requisitos

Instale na maquina:

- Node.js 20+ com npm
- Python 3.11+
- pip
- Acesso a uma base PostgreSQL

Comandos para verificar:

```bash
node -v
npm -v
python --version
pip --version
```

## Variaveis de ambiente

### Backend

Crie o arquivo `trippi-backend/.env`:

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

### Frontend

Crie o arquivo `trippi-frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Se `VITE_API_URL` nao for definido, o frontend usa `http://localhost:8000` por padrao.

## Como executar

### 1. Backend

Entre na pasta do backend:

```bash
cd trippi-backend
```

Crie e ative um ambiente virtual.

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

Instale as dependencias:

```bash
pip install -r requirements.txt
```

Inicie a API:

```bash
uvicorn app.main:socket_app --reload
```

Endpoints locais importantes:

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

### 2. Frontend

Em outro terminal, entre na pasta do frontend:

```bash
cd trippi-frontend
```

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra a URL exibida pelo Vite, normalmente:

```text
http://localhost:5173
```

## Scripts uteis

### Frontend

Dentro de `trippi-frontend/`:

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: gera a build de producao.
- `npm run preview`: sobe uma preview local da build.
- `npm run lint`: executa o lint do projeto.

### Backend

Dentro de `trippi-backend/`:

- `uvicorn app.main:socket_app --reload`: inicia a API com suporte a Socket.IO.

## Comunicacao entre frontend e backend

- O frontend consome a API REST via Axios.
- O token JWT e enviado automaticamente nas requisicoes autenticadas.
- A conexao de socket usa a mesma base definida em `VITE_API_URL`.
- O backend libera CORS para `localhost:5173`, `127.0.0.1:5173` e o deploy do frontend.

## Modulos principais

- `auth`: login e autenticacao com JWT.
- `trip`: CRUD de viagens e resumos financeiros.
- `trip_member`: gerenciamento de membros da viagem.
- `itinerary`: roteiro da viagem.
- `finance`: lancamentos financeiros e calculos de saldo.
