# Subsquid Indexer Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd indexer
npm install
```

### 2. Add Contract ABIs

Place your compiled contract ABIs in the `abi/` directory:

```bash
# Copy from your contracts build output
cp ../contracts/out/AgentRegistry.sol/AgentRegistry.json abi/
cp ../contracts/out/JobEscrow.sol/JobEscrow.json abi/
```

### 3. Generate TypeScript Types

```bash
npm run typegen
```

This generates type-safe event decoders in `src/abi/`.

### 4. Generate Database Models

```bash
npx squid-typeorm-codegen
```

This generates TypeORM entities from `schema.graphql` in `src/model/`.

### 5. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Arc chain configuration:

```env
ARC_RPC_URL=https://rpc.arc.network
ARC_CHAIN_ID=16180
AGENT_REGISTRY_ADDRESS=0x... # Your deployed AgentRegistry address
JOB_ESCROW_ADDRESS=0x...     # Your deployed JobEscrow address
```

### 6. Start Database

```bash
docker compose up -d
```

### 7. Run Migrations

```bash
npm run db:migrate
```

### 8. Build and Start Indexer

```bash
npm run build
npm run processor:start
```

## Development Workflow

### Watch Mode

```bash
npm run dev
```

### Creating New Migrations

After modifying `schema.graphql`:

```bash
npx squid-typeorm-codegen
npm run db:create-migration
npm run db:migrate
```

### Clean Restart

```bash
docker compose down -v
docker compose up -d
npm run db:migrate
npm run build
npm run processor:start
```

## Project Structure

```
indexer/
├── src/
│   ├── main.ts                 # Entry point
│   ├── processor.ts            # Processor configuration
│   ├── handlers/
│   │   ├── agentHandlers.ts    # Agent event handlers
│   │   └── jobHandlers.ts      # Job event handlers
│   ├── abi/                    # Generated from abi/*.json
│   └── model/                  # Generated from schema.graphql
├── abi/
│   ├── AgentRegistry.json      # Contract ABI (you provide)
│   └── JobEscrow.json          # Contract ABI (you provide)
├── schema.graphql              # Database schema definition
├── docker-compose.yml          # PostgreSQL
└── package.json
```

## Troubleshooting

### "Cannot find module '../model'"

Run: `npx squid-typeorm-codegen`

### "Cannot find module '../abi/AgentRegistry'"

1. Ensure ABIs are in `abi/` directory
2. Run: `npm run typegen`

### Database connection errors

Check:
- Docker is running: `docker ps`
- Database credentials in `.env`
- Port 5432 is not in use

### Indexer not processing events

Verify:
- Contract addresses in `.env` are correct (lowercase)
- RPC URL is accessible
- START_BLOCK is set correctly

## Next Steps

1. **Add contract ABIs** to `abi/` directory
2. **Run typegen** to generate event decoders
3. **Configure `.env`** with deployed contract addresses
4. **Start indexing** the Arc chain

## Subsquid Resources

- [Documentation](https://docs.subsquid.io/)
- [EVM Indexing Guide](https://docs.subsquid.io/sdk/guides/evm/)
- [Examples](https://github.com/subsquid/squid/tree/master/test)
