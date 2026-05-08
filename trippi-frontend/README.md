# 08/05 - Desenvolvimento Inicial
## Como iniciei o projeot
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

7. Como rodar
- npm run dev