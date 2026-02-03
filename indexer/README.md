# Indexer - Envoy Markets Blockchain Event Indexer

## Overview

The indexer is a **background service** that listens to Arc blockchain events from Envoy Markets smart contracts and syncs the data to the backend database. It maintains an **off-chain mirror** of on-chain state for fast querying and reduces the need for expensive RPC calls.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Node.js/Bun** | Runtime environment |
| **TypeScript** | Type safety |
| **Viem** | Lightweight Ethereum library (event parsing) |
| **PostgreSQL** | Database (shared with backend) |
| **WebSocket** | Real-time blockchain connection |

## Architecture

```
indexer/
├── src/
│   ├── listeners/        # Event listeners
│   │   ├── agentRegistryListener.ts   # AgentRegistry events
│   │   ├── jobEscrowListener.ts       # JobEscrow events
│   │   └── baseListener.ts            # Base listener class
│   │
│   ├── handlers/         # Event handlers (business logic)
│   │   ├── agentHandlers.ts           # Handle agent events
│   │   ├── jobHandlers.ts             # Handle job events
│   │   └── stakeHandlers.ts           # Handle stake events
│   │
│   ├── db/              # Database operations
│   │   ├── models.ts    # Database models/schema
│   │   ├── queries.ts   # SQL queries
│   │   └── connection.ts # DB connection pool
│   │
│   ├── utils/           # Utility functions
│   │   ├── logger.ts    # Logging utility
│   │   ├── retry.ts     # Retry logic for failed events
│   │   └── abi.ts       # Contract ABIs
│   │
│   └── index.ts         # Application entry point
│
├── config/
│   └── contracts.json   # Contract addresses and ABIs
│
├── tests/
│   └── handlers.test.ts
│
├── package.json
└── tsconfig.json
```

## Event Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INDEXER WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     Arc      │         │   Indexer    │         │   Database   │
│  Blockchain  │         │   Service    │         │ (PostgreSQL) │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. Event Emitted       │                        │
       │   AgentRegistered      │                        │
       │───────────────────────►│                        │
       │                        │                        │
       │                        │ 2. Parse Event         │
       │                        │    (decode logs)       │
       │                        │                        │
       │                        │ 3. Validate Data       │
       │                        │    (check schema)      │
       │                        │                        │
       │                        │ 4. Upsert to DB        │
       │                        │───────────────────────►│
       │                        │                        │
       │                        │ 5. Success             │
       │                        │◄───────────────────────│
       │                        │                        │
       │                        │ 6. Update Checkpoint   │
       │                        │    (last block synced) │
       │                        │───────────────────────►│
       │                        │                        │
       │ 7. Next Event...       │                        │
       │───────────────────────►│                        │
       │                        │                        │
```

## Events Indexed

### AgentRegistry Contract

| Event | Data | Database Table |
|-------|------|----------------|
| **AgentRegistered** | `agent address`, `stake amount`, `ENS name` | `agents` |
| **StakeAdded** | `agent address`, `amount`, `new total` | `agents`, `stake_history` |
| **StakeWithdrawn** | `agent address`, `amount`, `new total` | `agents`, `stake_history` |
| **StakeLocked** | `agent address`, `amount`, `job ID` | `agents`, `jobs` |
| **StakeUnlocked** | `agent address`, `amount`, `job ID` | `agents`, `jobs` |

### JobEscrow Contract

| Event | Data | Database Table |
|-------|------|----------------|
| **JobCreated** | `job ID`, `client`, `agent`, `price` | `jobs` |
| **JobSubmitted** | `job ID`, `deliverable URL` | `jobs` |
| **RevisionRequested** | `job ID`, `feedback` | `jobs`, `revisions` |
| **JobApproved** | `job ID` | `jobs`, `agent_reputation` |
| **JobDisputed** | `job ID`, `initiator` | `jobs`, `disputes` |
| **PaymentReleased** | `job ID`, `recipient`, `amount` | `jobs`, `payments` |

## Event Handlers

### Agent Registration Handler

```typescript
// handlers/agentHandlers.ts
import { db } from '../db/connection';

export async function handleAgentRegistered(event: {
  agent: string;
  stake: bigint;
  ensName: string;
  blockNumber: number;
  transactionHash: string;
}) {
  // Upsert agent record
  await db.query(`
    INSERT INTO agents (
      address,
      ens_name,
      total_staked,
      locked_stake,
      is_active,
      registered_at,
      registration_tx
    ) VALUES ($1, $2, $3, 0, true, NOW(), $4)
    ON CONFLICT (address) DO UPDATE SET
      ens_name = EXCLUDED.ens_name,
      total_staked = EXCLUDED.total_staked,
      is_active = true
  `, [event.agent, event.ensName, event.stake.toString(), event.transactionHash]);
  
  // Record in stake history
  await db.query(`
    INSERT INTO stake_history (
      agent_address,
      event_type,
      amount,
      new_total,
      block_number,
      transaction_hash,
      created_at
    ) VALUES ($1, 'registered', $2, $2, $3, $4, NOW())
  `, [event.agent, event.stake.toString(), event.blockNumber, event.transactionHash]);
  
  console.log(`✅ Indexed AgentRegistered: ${event.ensName} (${event.agent})`);
}
```

### Job Created Handler

```typescript
// handlers/jobHandlers.ts
export async function handleJobCreated(event: {
  jobId: bigint;
  client: string;
  agent: string;
  price: bigint;
  blockNumber: number;
  transactionHash: string;
}) {
  // Insert job record
  await db.query(`
    INSERT INTO jobs (
      id,
      client_address,
      agent_address,
      price,
      status,
      created_at,
      creation_tx,
      block_number
    ) VALUES ($1, $2, $3, $4, 'created', NOW(), $5, $6)
  `, [
    event.jobId.toString(),
    event.client,
    event.agent,
    event.price.toString(),
    event.transactionHash,
    event.blockNumber
  ]);
  
  // Update agent locked stake
  await db.query(`
    UPDATE agents
    SET locked_stake = locked_stake + $1
    WHERE address = $2
  `, [event.price.toString(), event.agent]);
  
  console.log(`✅ Indexed JobCreated: Job #${event.jobId}`);
}
```

### Job Approved Handler

```typescript
export async function handleJobApproved(event: {
  jobId: bigint;
  blockNumber: number;
  transactionHash: string;
}) {
  // Get job details first
  const job = await db.query(`
    SELECT agent_address, price FROM jobs WHERE id = $1
  `, [event.jobId.toString()]);
  
  if (!job.rows[0]) {
    console.error(`❌ Job #${event.jobId} not found in database`);
    return;
  }
  
  const { agent_address, price } = job.rows[0];
  
  // Update job status
  await db.query(`
    UPDATE jobs
    SET status = 'approved',
        approved_at = NOW(),
        approval_tx = $1
    WHERE id = $2
  `, [event.transactionHash, event.jobId.toString()]);
  
  // Unlock agent stake
  await db.query(`
    UPDATE agents
    SET locked_stake = locked_stake - $1
    WHERE address = $2
  `, [price, agent_address]);
  
  // Update reputation (jobs completed)
  await db.query(`
    UPDATE agent_reputation
    SET jobs_completed = jobs_completed + 1,
        updated_at = NOW()
    WHERE agent_address = $1
  `, [agent_address]);
  
  console.log(`✅ Indexed JobApproved: Job #${event.jobId}`);
}
```

## Listener Implementation

### Base Listener Class

```typescript
// listeners/baseListener.ts
import { createPublicClient, webSocket, parseAbiItem } from 'viem';
import { arc } from 'viem/chains';

export abstract class BaseListener {
  private client;
  private contractAddress: string;
  private lastSyncedBlock: bigint;
  
  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
    this.client = createPublicClient({
      chain: arc,
      transport: webSocket(process.env.ARC_WS_URL!),
    });
    this.lastSyncedBlock = await this.getLastSyncedBlock();
  }
  
  async start() {
    console.log(`🎧 Starting listener for ${this.contractAddress}`);
    
    // 1. Sync historical events (from last checkpoint to current block)
    await this.syncHistoricalEvents();
    
    // 2. Watch for new events
    this.watchEvents();
  }
  
  async syncHistoricalEvents() {
    const currentBlock = await this.client.getBlockNumber();
    
    if (this.lastSyncedBlock >= currentBlock) {
      console.log('✅ Already synced to latest block');
      return;
    }
    
    console.log(`📜 Syncing blocks ${this.lastSyncedBlock} → ${currentBlock}`);
    
    // Fetch events in chunks (to avoid RPC limits)
    const CHUNK_SIZE = 1000n;
    for (let from = this.lastSyncedBlock; from < currentBlock; from += CHUNK_SIZE) {
      const to = from + CHUNK_SIZE < currentBlock ? from + CHUNK_SIZE : currentBlock;
      
      const logs = await this.client.getLogs({
        address: this.contractAddress,
        fromBlock: from,
        toBlock: to,
      });
      
      for (const log of logs) {
        await this.processLog(log);
      }
      
      await this.updateCheckpoint(to);
    }
    
    console.log('✅ Historical sync complete');
  }
  
  watchEvents() {
    this.client.watchEvent({
      address: this.contractAddress,
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.processLog(log);
        }
      },
    });
  }
  
  abstract processLog(log: any): Promise<void>;
  
  async getLastSyncedBlock(): Promise<bigint> {
    const result = await db.query(`
      SELECT last_block FROM indexer_checkpoints
      WHERE contract_address = $1
    `, [this.contractAddress]);
    
    return result.rows[0]?.last_block || 0n;
  }
  
  async updateCheckpoint(blockNumber: bigint) {
    await db.query(`
      INSERT INTO indexer_checkpoints (contract_address, last_block, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (contract_address) DO UPDATE SET
        last_block = EXCLUDED.last_block,
        updated_at = NOW()
    `, [this.contractAddress, blockNumber.toString()]);
  }
}
```

### AgentRegistry Listener

```typescript
// listeners/agentRegistryListener.ts
import { BaseListener } from './baseListener';
import { parseAbiItem, decodeEventLog } from 'viem';
import * as handlers from '../handlers/agentHandlers';

export class AgentRegistryListener extends BaseListener {
  async processLog(log: any) {
    const topics = log.topics;
    
    // Determine event type from signature
    if (topics[0] === this.eventSignatures.AgentRegistered) {
      const event = decodeEventLog({
        abi: [parseAbiItem('event AgentRegistered(address indexed agent, uint256 stake, string ensName)')],
        data: log.data,
        topics: log.topics,
      });
      
      await handlers.handleAgentRegistered({
        agent: event.args.agent,
        stake: event.args.stake,
        ensName: event.args.ensName,
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
      });
    }
    
    // Handle other events...
  }
  
  private eventSignatures = {
    AgentRegistered: '0x...', // keccak256 hash of event signature
    StakeAdded: '0x...',
    StakeWithdrawn: '0x...',
    // ...
  };
}
```

## Database Schema

```sql
-- Indexer checkpoints (track last synced block)
CREATE TABLE indexer_checkpoints (
    contract_address VARCHAR(42) PRIMARY KEY,
    last_block BIGINT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents table (synced from AgentRegistry events)
CREATE TABLE agents (
    address VARCHAR(42) PRIMARY KEY,
    ens_name VARCHAR(255) UNIQUE,
    total_staked BIGINT NOT NULL,
    locked_stake BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    registered_at TIMESTAMP,
    registration_tx VARCHAR(66),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stake history (all stake events)
CREATE TABLE stake_history (
    id SERIAL PRIMARY KEY,
    agent_address VARCHAR(42) NOT NULL,
    event_type VARCHAR(20),  -- 'registered', 'added', 'withdrawn', 'locked', 'unlocked'
    amount BIGINT NOT NULL,
    new_total BIGINT,
    job_id INT,
    block_number BIGINT,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table (synced from JobEscrow events)
CREATE TABLE jobs (
    id INT PRIMARY KEY,
    client_address VARCHAR(42) NOT NULL,
    agent_address VARCHAR(42) NOT NULL,
    offering_id INT,
    price BIGINT NOT NULL,
    requirements_url TEXT,
    deliverable_url TEXT,
    status VARCHAR(20),  -- 'created', 'submitted', 'approved', 'disputed', etc.
    created_at TIMESTAMP,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    creation_tx VARCHAR(66),
    submission_tx VARCHAR(66),
    approval_tx VARCHAR(66),
    block_number BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Module Interactions

### Indexer ↔ Arc Blockchain
**Via:** WebSocket RPC connection

**Purpose:**
- Listen to contract events in real-time
- Fetch historical events on startup
- Parse event logs and extract data

### Indexer ↔ Database
**Shared with:** Backend (same PostgreSQL instance)

**Purpose:**
- Store parsed event data
- Maintain sync checkpoints
- Provide fast queryable data for backend API

### Indexer ↔ Backend
**Indirect connection**

**Relationship:**
- Indexer writes to database
- Backend reads from database
- No direct communication needed (database is the shared layer)

## Configuration

### Environment Variables

```env
# Arc Blockchain
ARC_RPC_URL=https://testnet-rpc.arc.network
ARC_WS_URL=wss://testnet-rpc.arc.network
ARC_CHAIN_ID=16180

# Contracts
AGENT_REGISTRY_ADDRESS=0x...
JOB_ESCROW_ADDRESS=0x...

# Database (shared with backend)
DATABASE_URL=postgresql://user:pass@localhost:5432/envoy

# Indexer Settings
SYNC_CHUNK_SIZE=1000  # Blocks per historical sync batch
RETRY_ATTEMPTS=3      # Retries for failed event processing
LOG_LEVEL=info        # debug, info, warn, error
```

## Development Setup

### Prerequisites
- **Node.js/Bun** >= 18
- **PostgreSQL** >= 14 (shared with backend)
- **Arc Testnet RPC access**

### Installation

```bash
# Install dependencies
npm install  # or: bun install

# Run database migrations (shared schema with backend)
npm run db:migrate

# Start indexer
npm run start
```

### Running in Development

```bash
# Start with auto-reload
npm run dev

# Run with debug logging
LOG_LEVEL=debug npm run start
```

## Error Handling

### Retry Logic

```typescript
// utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      console.warn(`⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Failed Event Handling

```typescript
// Store failed events for manual review
async function handleFailedEvent(log: any, error: Error) {
  await db.query(`
    INSERT INTO failed_events (
      contract_address,
      block_number,
      transaction_hash,
      log_index,
      error_message,
      raw_log,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  `, [
    log.address,
    log.blockNumber,
    log.transactionHash,
    log.logIndex,
    error.message,
    JSON.stringify(log),
  ]);
  
  console.error(`❌ Failed to process event: ${error.message}`);
}
```

## Monitoring

### Health Checks

```typescript
// Expose health endpoint for monitoring
import express from 'express';

const app = express();

app.get('/health', async (req, res) => {
  try {
    // Check blockchain connection
    const blockNumber = await client.getBlockNumber();
    
    // Check database connection
    await db.query('SELECT 1');
    
    // Check sync lag
    const checkpoint = await getLastSyncedBlock(AGENT_REGISTRY_ADDRESS);
    const lag = blockNumber - checkpoint;
    
    res.json({
      status: 'healthy',
      currentBlock: blockNumber.toString(),
      lastSyncedBlock: checkpoint.toString(),
      lag: lag.toString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

app.listen(3001, () => console.log('Health server running on :3001'));
```

### Metrics

Key metrics to track:
- **Sync lag:** Current block - Last synced block
- **Events processed per minute**
- **Failed events count**
- **Database write latency**

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

### Docker Compose (with backend)

```yaml
# docker-compose.yml
services:
  indexer:
    build: ./indexer
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/envoy
      - ARC_WS_URL=wss://testnet-rpc.arc.network
      - AGENT_REGISTRY_ADDRESS=${AGENT_REGISTRY_ADDRESS}
      - JOB_ESCROW_ADDRESS=${JOB_ESCROW_ADDRESS}
    restart: unless-stopped
  
  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=envoy

volumes:
  postgres_data:
```

## Key Design Decisions

1. **Why WebSocket?** Real-time event streaming, lower latency than polling
2. **Why checkpoint pattern?** Recover from crashes without re-syncing entire chain
3. **Why shared database?** Single source of truth, no API overhead
4. **Why chunk historical sync?** Avoid RPC rate limits and timeouts
5. **Why retry logic?** Handle temporary RPC failures gracefully

## Troubleshooting

### Indexer is falling behind
- Increase `SYNC_CHUNK_SIZE`
- Optimize database queries (add indexes)
- Scale to multiple indexers (shard by contract)

### Missing events
- Check `failed_events` table
- Verify contract addresses are correct
- Ensure RPC endpoint is reliable

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database connection pool limits
- Ensure migrations are up to date

## Related Modules

- **Contracts:** Source of events being indexed
- **Backend:** Consumes indexed data for API responses
- **Frontend:** Indirectly benefits from fast database queries
