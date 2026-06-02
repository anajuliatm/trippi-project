# README BACK (Temporario para organização de ideias)
## 28/05 - Desenvolvimento Inicial
### Como iniciei o backend

1. Criei o schema do BD
- disponivel no doc https://docs.google.com/document/d/1tvJu7uqi309EthyBCXsP0VtmDwbepxox94ejpu82bvs/edit?usp=sharing
- criei tudo no supabase
    - scripts e passos disponiveis no doc acima tb

2. inicialização do backend
- cd trippi-backend
- python -m venv .venv
- no windows: .venv\Scripts\activate
- pip install fastapi uvicorn psycopg2-binary sqlalchemy python-dotenv
- criei .env com as variaveis sensiveis do bd
- criei as pastas e arquivos do backend para futuro desenvolvimento
- rodei api pra teste: uvicorn app.main:app --reload
    - tudo ok em http://127.0.0.1:8000/docs
- criei models e os scripts python dentro
    - SQLAlchemy: biblioteca da linguagem Python que funciona como um kit de ferramentas SQL e um Object Relational Mapper (ORM). permite interação com bd usando classes e objetos python
    - SQLAlchemy trabalha com: tabela → classe Python; coluna → atributo.
    - models servem para consultas, insert, update, delete e orm

3. get e post: proximos passos, nessa ordem:
    - database session
        - dependencies.py criado: Cria e fecha conexão com o banco de dados automaticamente.
    - schemas
        - definem entrada da API, saida da API e validação
    - rotas de users
        - ja realiza POST /users e salva usuario no Supabase
        - registrei essa rota no main.py
    - rotas de trips, finance, itinerary, payments e trip_members
    - testar Swagger

4. Criação de put e delete pro crud

## 29/05 - Refat das rotas da API + Regras de Negócio
1. arrumei as rotas para manterem um padrao intuitivo
- ex: DELETE /finance/trip/{trip_id}/user/{user_id}/entry/{finance_id} - Fica mais intuitivo de saber que esta deletando uma entrada financeira de um usuario x na viagem y

2. comecei a desenvolver as regras de negócio
- finance_service.py:
    - centraliza a regra de negócio financeira
    - a criação do lançamento em finance_service valida a viagem, garante transação única
    - para type = expense, gera os payments automaticamente em finance_service, ignorando o pagador e evitando duplicidade via nota interna do lançamento
    - sincronização desses payments em atualização e remoção do lançamento em finance_service.py:77 e finance_service.py:124
    - endpoint de saldo individual ficou em finance_service.py:143, usando agregações SQLAlchemy para somar despesas por usuário e calcular paid, should_pay e balance.
- trip_service.py: 
    - concentra a lógica de viagens
    - o resumo financeiro pedido está em trip_service.py:110, retornando budget, total_contributions, total_expenses e remaining_balance
    - movi o CRUD de viagens para esse service para manter a rota mais curta.
- em finance.py adicionei os schemas de resposta
- sem regra de negócio nas rotas
- novos endpoints GET /trips/{trip_id}/summary e GET /trips/{trip_id}/balances

## 01/06 - Autenticação
1. autenticação com JWT
- add passlib[bcrypt] e python-jose[cryptography] nos requirements
- criação de um utilitario de segurança no backend core/security.py
- criação de um schema para autenticação: auth.py
- att dependencies.py: validação do token e usuário atual
- criação do router de autenticação e dps registei em main a rota
- a rota user passa a salvar senha com hash, nao mais em texto puro




---
### Integração com frontend
    - integrar frontend
