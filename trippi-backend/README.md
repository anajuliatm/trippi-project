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