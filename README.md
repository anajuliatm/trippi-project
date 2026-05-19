# Trippi Project

Projeto da disciplina de Sistemas Distribuidos com foco em planejamento e acompanhamento de viagens.

## Overview

O repositorio esta organizado em dois modulos:

- `trippi-frontend/`: aplicacao web em React + TypeScript (Vite).
- `trippi-backend/`: servico backend em Python.

## Tecnologias (frontend)

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Axios
- Framer Motion
- Lucide React

## Pre-requisitos para rodar o frontend

Instale na sua maquina:

- Node.js (recomendado: versao LTS 20+)
- npm (normalmente vem junto com o Node.js)

Para verificar:

```bash
node -v
npm -v
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

## Scripts uteis (frontend)

Dentro de `trippi-frontend/`:

- `npm run dev`: inicia ambiente de desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run preview`: sobe preview local da build.
- `npm run lint`: executa lint do projeto.