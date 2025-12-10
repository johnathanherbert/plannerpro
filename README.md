# PlannerPro - Planejamento Financeiro Familiar

**PlannerPro** é uma aplicação web completa para planejamento financeiro individual e familiar, construída com Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui e Firebase.

##  Funcionalidades

###  Principais Recursos

- **Autenticação Completa**
  - Login com email/senha
  - Login com Google OAuth
  - Criação de conta com fluxo de onboarding
  - Rotas protegidas com middleware

- **Modelo de Casa (Household)**
  - Crie ou participe de uma Casa para gerenciar finanças familiares
  - Convide membros via email
  - Gestão de permissões (Proprietário, Admin, Membro)
  - Sistema de convites com tokens únicos

- **Transações Inteligentes**
  - Registre receitas e despesas
  - Categorias predefinidas com ícones
  - Três tipos de transação: Pessoal, Casa, Compartilhado
  - Atualizações em tempo real via Firestore
  - Filtros por data, categoria e tipo

- **Dashboard Interativo**
  - Cards de balanço (Pessoal, Casa, Total)
  - Lista de transações com edição/exclusão
  - Visualização de membros da casa
  - Interface responsiva (mobile-first)

##  Pré-requisitos

- Node.js 18+ e npm
- Conta no Firebase (plano gratuito funciona)
- Git

##  Instalação e Configuração

### 1. Clone o Repositório

```bash
npm install
```

### 2. Configure o Firebase

1. Acesse Firebase Console: https://console.firebase.google.com/
2. Crie um novo projeto
3. Ative Authentication (Email/Senha e Google)
4. Crie Firestore Database (modo produção)
5. Copie as credenciais do firebaseConfig

### 3. Configure Variáveis de Ambiente

```bash
cp .env.local.example .env.local
```

Edite .env.local com suas credenciais do Firebase.

### 4. Deploy das Regras de Segurança

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. Execute Localmente

```bash
npm run dev
```

Abra http://localhost:3000

##  Deploy na Vercel

```bash
npm install -g vercel
vercel
```

Configure as variáveis de ambiente no dashboard da Vercel.

##  Estrutura do Projeto

- app/ - Next.js App Router (páginas e rotas)
- components/ - Componentes React e shadcn/ui
- hooks/ - React Hooks customizados
- services/ - Serviços Firebase
- lib/ - Utilitários (firebase, currency, date)
- types/ - Definições TypeScript
- utils/ - Funções utilitárias
- firestore.rules - Regras de segurança

##  Tecnologias

- Next.js 16.0.7
- React 19.2.0
- TypeScript 5.x
- Tailwind CSS 4.x
- Firebase 11.0.2+
- shadcn/ui
- React Hook Form + Zod
- date-fns
- Recharts

##  Comandos Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint
npm test             # Executa testes unitários
npm run test:e2e     # Executa testes E2E
npm run seed         # Popula banco com dados de exemplo
```

##  Segurança

Firestore Security Rules garantem:
-  Apenas usuários autenticados podem ler/escrever
-  Usuários só acessam dados de suas próprias casas
-  Apenas proprietários/admins gerenciam membros
-  Validação de convites por email

##  Troubleshooting

**Erro de permissões do Firestore:**
```bash
firebase deploy --only firestore:rules
```

**Build TypeScript falha:**
```bash
rm -rf .next && npm run build
```

##  Licença

MIT

##  Desenvolvido com

 e GitHub Copilot

---

**Dica:** Configure Firebase Storage para upload de comprovantes! 
