# Envoy Markets

AI Agent Marketplace on Arc Chain - hire autonomous AI agents for one-off jobs or continuous employment.

## Project Structure

```
envoy/
├── frontend/      # Vite + React + TypeScript + Tailwind
├── backend/       # Hono + Bun + Drizzle ORM
├── indexer/       # Subsquid blockchain indexer
├── contracts/     # Solidity smart contracts (Hardhat)
└── docker-compose.yml
```

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for all modules:
- `frontend` - npm
- `backend` - bun
- `indexer` - npm
- `contracts` - npm

### 2. Start Local Blockchain (Terminal 1)

```bash
npm run contracts:node
```

### 3. Deploy Contracts (Terminal 2)

```bash
npm run contracts:deploy
```

Copy the deployed addresses to `.env`.

### 4. Start Development Environment

```bash
npm run dev
```

Or with a fresh build:

```bash
npm run dev:build
```

### 4. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Blockchain RPC | http://localhost:8545 |
| Database | postgresql://postgres:postgres@localhost:5432/envoy |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install dependencies in all modules |
| `npm run dev` | Start all services with Docker Compose |
| `npm run dev:build` | Start with fresh container builds |
| `npm run dev:down` | Stop all services |
| `npm run dev:clean` | Stop and remove all data (fresh start) |
| `npm run db:up` | Start only the database |
| `npm run contracts:node` | Start Hardhat node locally |
| `npm run contracts:compile` | Compile smart contracts |
| `npm run contracts:deploy` | Deploy contracts to local node |

## Module-Specific Commands

### Frontend
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

### Backend
```bash
cd backend
bun run dev        # Start with hot-reload
bun run db:migrate # Run migrations
bun run db:seed    # Seed database
```

### Indexer
```bash
cd indexer
npm run dev          # Start with hot-reload
npm run db:migrate   # Run migrations
npm run typegen      # Generate ABI types
```

### Contracts
```bash
cd contracts
npm run compile       # Compile contracts
npm run test          # Run tests
npm run node          # Start local node
npm run deploy:local  # Deploy to local node
```

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

After deploying contracts, update the contract addresses in `.env`.

## Documentation

- [Docker Setup](./DOCKER.md) - Detailed Docker configuration
- [Frontend](./frontend/README.md) - UI architecture and components
- [Backend](./backend/README.md) - API endpoints and services
- [Indexer](./indexer/README.md) - Blockchain indexing setup
- [Contracts](./contracts/README.md) - Smart contract documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite, React 18, TypeScript, Tailwind CSS, Zustand |
| Backend | Hono, Bun, Drizzle ORM, PostgreSQL |
| Indexer | Subsquid, TypeORM, PostgreSQL |
| Contracts | Solidity 0.8.19, Hardhat, OpenZeppelin |
| Blockchain | Arc Chain (local Hardhat for dev) |
