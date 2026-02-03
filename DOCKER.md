# Docker Development Setup

## Quick Start

```bash
docker compose up --build
```

This starts all services:
- **PostgreSQL** (port 5432) - Shared database
- **Hardhat Node** (port 8545) - Local blockchain
- **Backend** (port 3000) - Hono API server
- **Indexer** - Subsquid processor
- **Frontend** (port 5173) - Vite dev server

## Services

| Service | Port | Description |
|---------|------|-------------|
| `db` | 5432 | PostgreSQL database |
| `contracts` | 8545 | Hardhat local blockchain node |
| `backend` | 3000 | Hono + Bun API server |
| `indexer` | - | Subsquid blockchain indexer |
| `frontend` | 5173 | Vite + React dev server |

## Hot Reloading

All services support hot-reloading in development:

- **Frontend**: Vite HMR
- **Backend**: Bun `--watch` mode
- **Indexer**: tsc-watch with auto-restart
- **Contracts**: Hardhat node (restart to redeploy)

Source files are mounted as volumes, so changes reflect immediately.

## Commands

### Start all services
```bash
docker compose up
```

### Start in background
```bash
docker compose up -d
```

### Rebuild after dependency changes
```bash
docker compose up --build
```

### Stop all services
```bash
docker compose down
```

### Stop and remove volumes (fresh start)
```bash
docker compose down -v
```

### View logs
```bash
docker compose logs -f [service]
```

### Run command in service
```bash
docker compose exec backend bun run db:migrate
docker compose exec contracts npm run deploy:local
```

## Initial Setup

### 1. Deploy Contracts

After starting, deploy contracts to the local node:

```bash
docker compose exec contracts npm run deploy:local
```

Copy the deployed addresses and update `.env`:
```env
AGENT_REGISTRY_ADDRESS=0x...
JOB_ESCROW_ADDRESS=0x...
USDC_ADDRESS=0x...
```

### 2. Run Database Migrations

```bash
docker compose exec backend bun run db:migrate
docker compose exec indexer npm run db:migrate
```

### 3. Access Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Blockchain RPC: http://localhost:8545

## Troubleshooting

### Port already in use
```bash
docker compose down
lsof -i :5432  # Check what's using the port
```

### Database connection issues
```bash
docker compose exec db psql -U postgres -d envoy
```

### Contract deployment fails
```bash
docker compose restart contracts
docker compose exec contracts npm run deploy:local
```

### Clear everything and start fresh
```bash
docker compose down -v
docker compose up --build
```

## Individual Service Development

To run a single service with its dependencies:

```bash
docker compose up db contracts backend
```

Or run services outside Docker while using Docker for database:

```bash
docker compose up db contracts
cd backend && bun run dev
```
