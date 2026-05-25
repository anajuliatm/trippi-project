# README FRONT (Temporario para organização de ideias)
## 08/05 - Desenvolvimento Inicial
### Como iniciei o projeot
1. Criação do app React + Vite 
npm create vite@latest trippi-frontend -- --template react-ts

cd trippi-frontend

npm install

npm install react-router-dom axios zustand framer-motion socket.io-client lucide-react

2. Limpeza e criação de módulos
- Apaguei App.css e index.css
- Limpei código default de App.tsx
- Criei a estrutura de pastas modular:

- components/ -> componentes reutilizáveis (botoes, cards, etc)
- pages/ -> telas completas da aplicação (dashboard, financeiro, detalhes)
- layouts/ -> estruturas fixas (sidebar fixa, header)
- services/ -> comunicação externa pra api e websocket
- store/ -> estado global do sistema (usuario logado, viagem selecionada, etc)
styles/ css global

3. Criei o css global basico
- Código basico com body, button e a
- Importação no main.tsx

4. Configurei rotas
- criei AppRoutes.tsx em routes/
- criei DashboardPage em pages/Dashboard/
atualizei App.tsx com a rota

5. Criando layout
- em src/layouts/MainLayout.tsx adicionei o layout principal MainLayout.tsx
- criei a sidebar em comum src/components/common/Sidebar.tsx
- alterei o DashboardPage em pages/Dashboard para importar o MainLayout

6. criei card de viagem
- em src/components/dashboard criei TripCard.tsx
- adicionei o componente na pagina DashboardPage

7. criei paleta de cores azul pro projeto e identidade visual
- adicionei variables.css em styles
- importei no css global
- atualizei css do body
- adicionei logo

8. criei mock data pra testar interface antes do backend ser criado

9. criei biblioteca de gerenciamento de estado - zustand
- em src/store/ criei tripStore que permite qualquer componente acessar qual viagem foi selecionada
- acessam selectedTripId, sem precisar passar props por 10 componentes

10. mudanças em trip card
- recebe props reais
- na pagina DashboardPage mostra as viagens com os dados do mock p simular backend

11. criação da cards
- em components/dashboard/ criei CountdownCard
- adicionei o card na pagina do dashboard
- em components/finance/ criei FinanceCard, importei na pagina do dashboard e adicionei os cards na pagina
- em components/itinerary/ criei Timeline.tsx, importei em dashboard e adc o card

12. proximo passo:
- melhorar frontend

### Como rodar
> npm run dev

## 15/05 - Refatoração de alguns códigos

1. troquei o logo por um de melhor resolução

2. refatorei os códigos do front para centralizar os .css na pasta styles e nao ter código css jogado por ai

3. corrigi alguns css para melhorar a interface e a responsividade:
- correção do espaçamento entre os componentens
- sidebar fixa para acompanhar a navegação

4. criei novas paginas para a navegação
- expandi os dados em trips.ts de src/mock/ com itinerarios por dia e utilitarios
- deixei o card TripCard.tsx clicavel (components/dashboard/)
- atualizei DashboardPage.tsx para redirecionar a pagina clicada
- adicionei a rota em AppRoutes.tsx, ex: trip/id (src/routes/)
- criei uma nova pagina TripDetailsPage.tsx
    - capa
    - destaque ao financeiro
    - passeios do roteiro organizados por aba
- ajustei o css do card (card.css) para melhorar a responsividade e a aparencia

5. criei pagina que lista as viagens:
- adicionei a rota para esssa pagina em routes/AppRoutes.jsx
- na tela das viagens criei:
    - aba 'ativas' e 'concluidas' com destaque visual
    - cards das viagens
    - navegação para pagina detalhes ao clicar na viagem
    - css em trips-pages.css
    - atualizei a sidebar para suportar a navegação
    - atualizei um mock de uma viagem concluida pra mostrar na pagina
        - obs: dashboard só mostra viagens ativas

## 19/05 - Edição de front-end + Criação da página financeiro
- correção no hover que eu nao estava gostando - agora o card só "salta", nao fica com uma borda colorida no hover

- edição do botão de voltar
    - volta pra pagina anterior e nao sempre pra Dashboard
    - componentização do botão voltar para ser reutilizado

- Detalhes da Viagem
    - organização por abas

- Adição de ícones para futuro CRUD

- criação da página de Finanças
    - adicionado a rota em AppRoutes
    - criação da pagina FinancePage.tsx
    - criação do mock de finanças (finance.ts)
    - redirecionamento da sidebar no botão Financeiro

- criação da página de login/cadastro
    - criação do css do login em login-page.css
    - adição da rota em AppRoutes.tsx
    - criação da pagina LoginPage.tsx

- logout na sidebar
    - mudanças no css da sidebar para suportar
    - adição no componente comum da sidedar

## 25/05 - Adição do perfil editavel do usuario + Ajustes
- criei uma pagina para editar perfil do usuario
    - adicionei e editei os mocks pra simular isso
- adicionei valor nos itens do roteiro
    - adicionei os lançamentos na página financeiro da viagem
