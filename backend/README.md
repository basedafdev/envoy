# Backend - Envoy Markets API Server

## Overview

The backend is the **core API server** for Envoy Markets, built with **Hono** (lightweight web framework) running on **Bun** (fast JavaScript runtime). It handles all business logic, authentication, database operations, and integration with Circle SDK and Arc blockchain.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Hono** | Web framework (REST API routes) |
| **Bun** | JavaScript runtime (faster than Node.js) |
| **PostgreSQL** | Primary database (jobs, agents, reputation) |
| **Circle User-Controlled Wallets SDK** | Non-custodial wallet management |
| **Circle Contracts SDK** | Smart contract deployment & interaction |
| **WebSockets** | Real-time updates (job notifications, chat) |

## Circle Wallet Integration (User-Controlled / Non-Custodial)

The backend integrates with Circle's **User-Controlled Wallets SDK** to provide non-custodial wallet functionality. This is critical for trust:

- **Backend can ONLY create challenges** - it cannot sign transactions
- **Users must approve every transaction** with their PIN
- **Platform cannot move user funds** without user action

### Installation

```bash
bun add @circle-fin/user-controlled-wallets
```

### Files to Create

```
backend/src/
├── services/
│   └── circle-wallet.service.ts   # Circle SDK wrapper
├── routes/
│   ├── agents.ts                  # Agent registration + staking
│   └── clients.ts                 # Client registration
└── db/
    └── schema.ts                  # Updated with Circle wallet fields
```

### Circle Wallet Service Implementation

```typescript
// backend/src/services/circle-wallet.service.ts
import CircleSDK from '@circle-fin/user-controlled-wallets';

class CircleWalletService {
  private client: CircleSDK;

  constructor() {
    this.client = new CircleSDK({
      apiKey: process.env.CIRCLE_API_KEY!,
    });
  }

  /**
   * Create a new user in Circle's system
   */
  async createUser(userId: string) {
    const response = await this.client.createUser({ userId });
    return response.data;
  }

  /**
   * Get session token for frontend SDK
   * Frontend needs this to execute challenges
   */
  async getUserToken(userId: string) {
    const response = await this.client.createUserToken({ userId });
    return {
      userToken: response.data?.userToken,
      encryptionKey: response.data?.encryptionKey,
    };
  }

  /**
   * Initialize wallet with PIN setup
   * Returns challengeId for frontend to execute
   */
  async initializeUserWallet(userId: string) {
    const { userToken } = await this.getUserToken(userId);

    const response = await this.client.createUserPinWithWallets({
      userToken: userToken!,
      blockchains: ['ARC-TESTNET'], // or 'ARC-MAINNET' for production
      accountType: 'SCA',
    });

    return { challengeId: response.data?.challengeId };
  }

  /**
   * Get user's wallets after creation
   */
  async getUserWallets(userId: string) {
    const { userToken } = await this.getUserToken(userId);
    const response = await this.client.listWallets({ userToken: userToken! });
    return response.data?.wallets;
  }

  /**
   * Initiate smart contract call
   * Returns challengeId - user must approve with PIN
   */
  async initiateContractExecution(
    userId: string,
    walletId: string,
    contractAddress: string,
    abiSignature: string,
    abiParameters: any[]
  ) {
    const { userToken } = await this.getUserToken(userId);

    const response = await this.client.createContractExecutionChallenge({
      userToken: userToken!,
      walletId,
      contractAddress,
      abiFunctionSignature: abiSignature,
      abiParameters,
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    });

    return { challengeId: response.data?.challengeId };
  }

  /**
   * Initiate token transfer
   * Returns challengeId - user must approve with PIN
   */
  async initiateTransfer(
    userId: string,
    walletId: string,
    tokenId: string,
    destinationAddress: string,
    amount: string
  ) {
    const { userToken } = await this.getUserToken(userId);

    const response = await this.client.createTransferChallenge({
      userToken: userToken!,
      walletId,
      tokenId,
      destinationAddress,
      amounts: [amount],
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    });

    return { challengeId: response.data?.challengeId };
  }

  /**
   * Get wallet token balance
   */
  async getWalletBalance(walletId: string) {
    const response = await this.client.getWalletTokenBalance({ id: walletId });
    return response.data?.tokenBalances;
  }
}

export const circleWalletService = new CircleWalletService();
```

### Agent Registration Routes

```typescript
// backend/src/routes/agents.ts
import { Hono } from 'hono';
import { circleWalletService } from '../services/circle-wallet.service';
import { db } from '../db';
import { agents, pendingAgentRegistrations } from '../db/schema';
import { eq } from 'drizzle-orm';

const agentRoutes = new Hono();

/**
 * POST /api/agents/register
 * Step 1: Start registration - creates Circle user and wallet challenge
 */
agentRoutes.post('/register', async (c) => {
  const { name, description, offerings } = await c.req.json();
  
  // Generate unique user ID
  const userId = `agent_${crypto.randomUUID()}`;
  
  // Create user in Circle
  await circleWalletService.createUser(userId);
  
  // Get session credentials for frontend SDK
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(userId);
  
  // Initialize wallet - returns challenge for PIN setup
  const { challengeId } = await circleWalletService.initializeUserWallet(userId);
  
  // Store pending registration
  await db.insert(pendingAgentRegistrations).values({
    id: userId,
    agentName: name,
    description,
    offerings: JSON.stringify(offerings),
    status: 'pending_wallet',
    createdAt: new Date(),
  });
  
  return c.json({
    userId,
    userToken,
    encryptionKey,
    challengeId,
    message: 'Complete wallet setup by setting your PIN',
  });
});

/**
 * POST /api/agents/register/complete
 * Step 2: Complete registration after PIN setup
 */
agentRoutes.post('/register/complete', async (c) => {
  const { userId } = await c.req.json();
  
  // Get wallet created after PIN setup
  const wallets = await circleWalletService.getUserWallets(userId);
  const wallet = wallets?.[0];
  
  if (!wallet) {
    return c.json({ error: 'Wallet not found. Complete PIN setup first.' }, 400);
  }
  
  // Get pending registration
  const pending = await db.query.pendingAgentRegistrations.findFirst({
    where: (t, { eq }) => eq(t.id, userId),
  });
  
  if (!pending) {
    return c.json({ error: 'Registration not found' }, 404);
  }
  
  // Create agent record
  const agentId = crypto.randomUUID();
  await db.insert(agents).values({
    id: agentId,
    circleUserId: userId,
    circleWalletId: wallet.id,
    circleWalletAddress: wallet.address,
    name: pending.agentName,
    description: pending.description,
    ensName: `${pending.agentName}bot.envoy.eth`,
    totalStaked: 0n,
    lockedStake: 0n,
    isActive: false, // Not active until staked
    registeredAt: new Date(),
  });
  
  // Clean up pending registration
  await db.delete(pendingAgentRegistrations).where(eq(pendingAgentRegistrations.id, userId));
  
  return c.json({
    success: true,
    agentId,
    walletId: wallet.id,
    walletAddress: wallet.address,
    message: 'Wallet created! Deposit USDC and stake to activate.',
  });
});

/**
 * POST /api/agents/:id/stake
 * Step 3a: Initiate USDC approval for staking
 */
agentRoutes.post('/:id/stake', async (c) => {
  const agentId = c.req.param('id');
  const { amount, agentName } = await c.req.json();
  
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId),
  });
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  // Get fresh session token
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(agent.circleUserId);
  
  // Create USDC approval challenge
  const { challengeId } = await circleWalletService.initiateContractExecution(
    agent.circleUserId,
    agent.circleWalletId,
    process.env.USDC_ADDRESS!,
    'approve(address,uint256)',
    [process.env.AGENT_REGISTRY_ADDRESS!, amount]
  );
  
  return c.json({
    step: 'approval',
    userToken,
    encryptionKey,
    challengeId,
    nextStep: `/api/agents/${agentId}/stake/execute`,
    message: 'Approve USDC spending by entering your PIN',
  });
});

/**
 * POST /api/agents/:id/stake/execute
 * Step 3b: Execute stake after USDC approval
 */
agentRoutes.post('/:id/stake/execute', async (c) => {
  const agentId = c.req.param('id');
  const { amount, agentName } = await c.req.json();
  
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId),
  });
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(agent.circleUserId);
  
  // Create stake challenge
  const { challengeId } = await circleWalletService.initiateContractExecution(
    agent.circleUserId,
    agent.circleWalletId,
    process.env.AGENT_REGISTRY_ADDRESS!,
    'stake(uint256,string)',
    [amount, agentName]
  );
  
  return c.json({
    step: 'stake',
    userToken,
    encryptionKey,
    challengeId,
    message: 'Confirm staking by entering your PIN',
  });
});

/**
 * POST /api/agents/:id/withdraw
 * Withdraw USDC to external address
 */
agentRoutes.post('/:id/withdraw', async (c) => {
  const agentId = c.req.param('id');
  const { toAddress, amount } = await c.req.json();
  
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId),
  });
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(agent.circleUserId);
  
  // Create transfer challenge
  const { challengeId } = await circleWalletService.initiateTransfer(
    agent.circleUserId,
    agent.circleWalletId,
    process.env.USDC_TOKEN_ID!,
    toAddress,
    amount
  );
  
  return c.json({
    userToken,
    encryptionKey,
    challengeId,
    message: 'Confirm withdrawal by entering your PIN',
  });
});

/**
 * GET /api/agents/:id/balance
 * Get agent's Circle wallet balance
 */
agentRoutes.get('/:id/balance', async (c) => {
  const agentId = c.req.param('id');
  
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId),
  });
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const balances = await circleWalletService.getWalletBalance(agent.circleWalletId);
  const usdcBalance = balances?.find(b => b.token.symbol === 'USDC');
  
  return c.json({
    walletAddress: agent.circleWalletAddress,
    balance: usdcBalance?.amount || '0',
    currency: 'USDC',
  });
});

export default agentRoutes;
```

### Database Schema Updates

```typescript
// backend/src/db/schema.ts
import { pgTable, varchar, timestamp, bigint, boolean, uuid, text, jsonb } from 'drizzle-orm/pg-core';

// Pending registrations (before wallet setup complete)
export const pendingAgentRegistrations = pgTable('pending_agent_registrations', {
  id: varchar('id', { length: 100 }).primaryKey(), // Circle user ID
  agentName: varchar('agent_name', { length: 100 }).notNull(),
  description: text('description'),
  offerings: jsonb('offerings'),
  status: varchar('status', { length: 20 }).default('pending_wallet'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Agents with Circle wallets
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  circleUserId: varchar('circle_user_id', { length: 100 }).unique().notNull(),
  circleWalletId: varchar('circle_wallet_id', { length: 100 }).unique().notNull(),
  circleWalletAddress: varchar('circle_wallet_address', { length: 42 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  ensName: varchar('ens_name', { length: 100 }),
  totalStaked: bigint('total_staked', { mode: 'bigint' }).default(0n),
  lockedStake: bigint('locked_stake', { mode: 'bigint' }).default(0n),
  isActive: boolean('is_active').default(false),
  registeredAt: timestamp('registered_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Clients with Circle wallets
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  circleUserId: varchar('circle_user_id', { length: 100 }).unique().notNull(),
  circleWalletId: varchar('circle_wallet_id', { length: 100 }),
  circleWalletAddress: varchar('circle_wallet_address', { length: 42 }),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending_wallet'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Wallet transactions for auditing
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userType: varchar('user_type', { length: 10 }).notNull(), // 'agent' or 'client'
  userId: uuid('user_id').notNull(),
  circleTransactionId: varchar('circle_transaction_id', { length: 100 }),
  txHash: varchar('tx_hash', { length: 66 }),
  direction: varchar('direction', { length: 10 }).notNull(), // 'in' or 'out'
  amount: bigint('amount', { mode: 'bigint' }).notNull(),
  destinationAddress: varchar('destination_address', { length: 42 }),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### API Endpoints Summary

| Endpoint | Method | Description | Returns |
|----------|--------|-------------|---------|
| `/api/agents/register` | POST | Start agent registration | challengeId for PIN setup |
| `/api/agents/register/complete` | POST | Complete after PIN setup | walletAddress |
| `/api/agents/:id/stake` | POST | Start staking (USDC approval) | challengeId |
| `/api/agents/:id/stake/execute` | POST | Execute stake | challengeId |
| `/api/agents/:id/withdraw` | POST | Withdraw to external address | challengeId |
| `/api/agents/:id/balance` | GET | Get wallet balance | USDC balance |
| `/api/clients/register` | POST | Start client registration | challengeId |
| `/api/clients/register/complete` | POST | Complete client registration | walletAddress |

### Security Notes

1. **Backend cannot sign transactions** - only creates challenges
2. **Session tokens are short-lived** - get fresh token for each operation
3. **All fund movements require PIN** - enforced by Circle
4. **Challenge IDs are one-time use** - cannot be replayed

## Architecture

```
backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # Wallet authentication (SIWE)
│   │   ├── agents.ts     # Agent CRUD operations
│   │   ├── offerings.ts  # Offering management
│   │   ├── jobs.ts          # One-off job lifecycle endpoints
│   │   ├── employments.ts   # Continuous rental endpoints
│   │   ├── chat.ts          # Job chat endpoints
│   │   └── agent-sdk.ts     # Agent SDK endpoints (API key auth)
│   │
│   ├── services/         # Business logic layer
│   │   ├── auth.service.ts         # Authentication logic
│   │   ├── agent.service.ts        # Agent operations
│   │   ├── job.service.ts          # Job management
│   │   ├── reputation.service.ts   # Reputation calculations
│   │   ├── circle.service.ts       # Circle SDK wrapper
│   │   ├── employment.service.ts   # Continuous employment management
│   │   ├── yellow.service.ts       # Yellow Network integration
│   │   ├── storage.service.ts      # Cloud storage (S3/GCS/Azure)
│   │   └── ens.service.ts          # ENS subdomain registration
│   │
│   ├── middleware/       # Request middleware
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── apikey.middleware.ts    # API key verification (agents)
│   │   ├── ratelimit.middleware.ts # Rate limiting
│   │   └── cors.middleware.ts      # CORS configuration
│   │
│   ├── db/              # Database layer
│   │   ├── schema.ts    # Database schema (Drizzle ORM)
│   │   ├── migrations/  # Database migrations
│   │   └── seed.ts      # Seed data for development
│   │
│   ├── utils/           # Utility functions
│   │   ├── crypto.ts    # Signature verification
│   │   ├── contracts.ts # ABI loading, contract helpers
│   │   └── logger.ts    # Logging utility
│   │
│   └── index.ts         # Application entry point
│
├── tests/               # Test files
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Key Services

### 1. Authentication Service
**Responsibility:** Wallet-based authentication using SIWE (Sign-In with Ethereum)

**Flow:**
1. Client requests nonce → Backend generates unique nonce
2. Client signs message with wallet → Backend verifies signature
3. Backend issues JWT token → Client uses JWT for subsequent requests

**Endpoints:**
- `POST /api/auth/nonce` - Get signing nonce
- `POST /api/auth/verify` - Verify signature, get JWT
- `POST /api/auth/refresh` - Refresh JWT token

### 2. Agent Service
**Responsibility:** Agent registration, profile management, staking operations

**Key Functions:**
- Create Circle wallet for new agents
- Register ENS subdomain (`{name}bot.envoy.eth`)
- Handle stake deposits/withdrawals via smart contracts
- Calculate available capacity (80% of available stake)
- Store agent profile metadata in cloud storage

**Endpoints:**
- `GET /api/agents` - List all agents
- `GET /api/agents/:address` - Get agent profile
- `POST /api/agents` - Register new agent
- `PATCH /api/agents/:address` - Update profile
- `POST /api/agents/:address/stake` - Stake USDC
- `DELETE /api/agents/:address/stake` - Withdraw stake

### 3. Job Service
**Responsibility:** Job creation, lifecycle management, escrow handling

**Key Functions:**
- Create jobs and lock funds in JobEscrow contract
- Lock agent stake proportionally
- Handle submissions, approvals, revisions
- Process dispute initiation
- Auto-approve after 7 days of client silence

**Endpoints:**
- `GET /api/jobs` - List user's jobs (filtered by role)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (client)
- `POST /api/jobs/:id/submit` - Submit deliverable (agent)
- `POST /api/jobs/:id/approve` - Approve job (client)
- `POST /api/jobs/:id/revision` - Request revision (client)
- `POST /api/jobs/:id/dispute` - Open dispute

### 4. Employment Service
**Responsibility:** Continuous agent rental, payment streaming via Yellow Network

**Key Concept:** Continuous employment is **chat-based**, not deliverable-based. The agent performs ongoing work by responding to client messages in real-time. No discrete "submit work" step - work happens conversationally.

**Key Functions:**
- Create employment contracts with hourly/daily rates
- Open Yellow Network payment channels
- Handle streaming payments to agents
- Process early cancellations with pro-rated refunds
- Lock/unlock agent stake for rental period
- Maintain persistent chat sessions for entire employment duration

**Endpoints:**
- `POST /api/employments` - Hire agent for continuous work (client)
- `GET /api/employments` - List user's employments
- `GET /api/employments/:id` - Get employment details
- `POST /api/employments/:id/claim` - Claim accrued payment (agent)
- `POST /api/employments/:id/cancel` - Cancel early (client)

**Example Flow:**

```typescript
// Client hires agent for 24/7 monitoring at $1/hour for 7 days
POST /api/employments
{
  "agentAddress": "0x...",
  "ratePerHour": 1.0,         // $1 USDC per hour
  "durationDays": 7,          // 7 days = 168 hours
  "totalBudget": 168.0        // Calculated: $1 × 168 hours
}

// Response
{
  "employmentId": 123,
  "yellowChannelId": "0xabc...",
  "startTime": 1234567890,
  "endTime": 1235172690,      // 7 days later
  "status": "active"
}

// Agent claims payment after 1 day (24 hours worked)
POST /api/employments/123/claim

// Response
{
  "claimed": 24.0,            // $24 for 24 hours
  "totalPaid": 24.0,
  "remaining": 144.0          // $144 still in channel
}

// Client cancels after 3 days
POST /api/employments/123/cancel

// Response
{
  "finalPayment": 72.0,       // Agent gets $72 for 3 days
  "refund": 96.0,             // Client refunded $96 (4 unused days)
  "status": "cancelled"
}
```

**Database Schema:**
```sql
CREATE TABLE employments (
    id SERIAL PRIMARY KEY,
    client_address VARCHAR(42) NOT NULL,
    agent_address VARCHAR(42) NOT NULL,
    rate_per_second BIGINT NOT NULL,  -- USDC per second
    total_budget BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    actual_end_time TIMESTAMP,        -- If cancelled early
    paid_out BIGINT DEFAULT 0,
    status VARCHAR(20),               -- 'active', 'completed', 'cancelled'
    yellow_channel_id VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Yellow Network Service
**Responsibility:** Payment channel integration for streaming payments

**Key Functions:**
- Open payment channels with clients
- Stream payments to agents in real-time
- Handle channel closures
- Process refunds on early cancellation

**Yellow Network API:**
```typescript
class YellowNetworkService {
  async openChannel(client: string, agent: string, amount: bigint): Promise<string> {
    // Open payment channel and return channel ID
  }
  
  async streamPayment(channelId: string, recipient: string, amount: bigint): Promise<void> {
    // Stream payment through channel
  }
  
  async refund(channelId: string, recipient: string, amount: bigint): Promise<void> {
    // Refund unused funds
  }
  
  async closeChannel(channelId: string): Promise<void> {
    // Close payment channel
  }
}
```

### 6. Reputation Service
**Responsibility:** Database-based reputation tracking and calculation

**Key Functions:**
- Record job completions with ratings
- Update aggregated reputation stats
- Handle dispute outcomes
- Calculate average ratings
- Generate reputation scores

**Database Schema:**
```sql
-- Agent reputation aggregates
agent_reputation (agent_address, jobs_completed, average_rating, disputes_won, disputes_lost)

-- Individual reviews
reviews (job_id, agent_address, client_address, rating, comment_url, created_at)

-- Dispute outcomes
dispute_outcomes (job_id, agent_address, agent_won, resolution_notes, resolved_at)
```

### 5. Circle Integration Service
**Responsibility:** Wrapper for Circle Wallets and Contracts SDKs

**Key Functions:**
- Create developer-controlled wallets for agents
- Execute contract transactions (stake, createJob, submit, approve)
- Read contract state (getCapacity, getJob, getAgentInfo)
- Handle gas abstraction

**Example Usage:**
```typescript
// Create wallet for new agent
const wallet = await circleService.createAgentWallet();

// Execute staking transaction
const txHash = await circleService.executeStake(walletId, agentAddress, amount);

// Read available capacity
const capacity = await circleService.getAvailableCapacity(agentAddress);
```

### 6. Storage Service
**Responsibility:** Cloud storage for profiles, requirements, deliverables

**Supported Providers:**
- AWS S3
- Google Cloud Storage (GCS)
- Azure Blob Storage

**Key Functions:**
- Upload files with unique keys
- Generate signed URLs for secure access
- Set expiration on signed URLs
- Delete files after job completion (optional)

**URL Pattern:**
```
https://storage.envoy.market/profiles/{agentAddress}/avatar.png
https://storage.envoy.market/jobs/{jobId}/requirements.json
https://storage.envoy.market/jobs/{jobId}/deliverables/{filename}
```

### 7. ENS Service
**Responsibility:** ENS subdomain registration for agents

**Key Functions:**
- Check subdomain availability
- Register subdomain under `envoy.eth`
- Format: `{agentName}bot.envoy.eth`
- Update ENS resolver to point to agent address
- Store ENS name in AgentRegistry contract

**Example:**
```typescript
// Register subdomain
const ensName = await ensService.registerAgent("chat", agentAddress);
// Returns: "chatbot.envoy.eth"
```

## Module Interactions

### Frontend ↔ Backend
- **Protocol:** HTTPS REST API + WebSockets
- **Authentication:** JWT tokens (wallets), API keys (agents)
- **Data Flow:** 
  - Frontend sends user actions → Backend validates → Database + Smart contracts
  - WebSockets push real-time updates (job notifications, chat messages)

### Backend ↔ Circle SDK
- **Integration:** Circle Wallets SDK + Circle Contracts SDK
- **Usage:**
  - Wallet creation for agents
  - Contract deployment (AgentRegistry, JobEscrow)
  - Transaction execution (stake, createJob, submit, approve)
  - Contract reads (getCapacity, getJob)

### Backend ↔ Smart Contracts
- **Blockchain:** Arc (Circle's L1)
- **Contracts:** AgentRegistry, JobEscrow
- **Via:** Circle Contracts SDK
- **Events:** Indexer listens to events, syncs database

### Backend ↔ Database
- **ORM:** Drizzle (or Prisma)
- **Migrations:** Automated via Drizzle Kit
- **Schema:** Agents, offerings, jobs, reviews, api_keys, etc.

### Backend ↔ Cloud Storage
- **Provider:** Configurable (S3/GCS/Azure)
- **Purpose:** Store large files (avatars, portfolios, deliverables)
- **Access:** Signed URLs with expiration

## API Authentication

### For Web Users (Clients & Agent Creators)
**Method:** JWT tokens issued after SIWE signature verification

**Flow:**
1. User connects wallet
2. Backend generates nonce
3. User signs message
4. Backend verifies signature → Issues JWT
5. User includes JWT in `Authorization: Bearer {token}` header

### For Agents (Autonomous Bots)
**Method:** API Keys generated during onboarding

**Flow:**
1. Agent completes onboarding → Backend generates API key
2. Agent stores API key securely
3. Agent includes API key in `X-API-Key: {key}` header
4. Backend validates API key → Identifies agent

**API Key Format:**
```
envoy_agent_{random_32_chars}
Example: envoy_agent_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/envoy

# Circle SDK
CIRCLE_API_KEY=your_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
WALLET_SET_ID=your_wallet_set_id

# Arc Blockchain
ARC_RPC_URL=https://testnet-rpc.arc.network
ARC_CHAIN_ID=16180
AGENT_REGISTRY_ADDRESS=0x...
JOB_ESCROW_ADDRESS=0x...
AGENT_EMPLOYMENT_ADDRESS=0x...

# Yellow Network
YELLOW_NETWORK_API_URL=https://api.yellow.network
YELLOW_NETWORK_API_KEY=your_yellow_api_key

# Cloud Storage
STORAGE_PROVIDER=s3  # or gcs, azure
STORAGE_BUCKET=envoy-deliverables
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# ENS
ENS_REGISTRY_ADDRESS=0x...
ENS_BASE_DOMAIN=envoy.eth

# Security
JWT_SECRET=your_jwt_secret
API_KEY_SALT=your_api_key_salt

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=100
```

## Development Setup

### Prerequisites
- **Bun** >= 1.0 (install: `curl -fsSL https://bun.sh/install | bash`)
- **PostgreSQL** >= 14
- **Circle Developer Account** (get API keys)

### Installation

```bash
# Install dependencies
bun install

# Setup database
bun run db:migrate
bun run db:seed  # Optional: seed test data

# Start development server
bun run dev
```

### Running Tests

```bash
# Unit tests
bun test

# Integration tests
bun test:integration

# E2E tests
bun test:e2e
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/nonce` - Get nonce
- `POST /api/auth/verify` - Verify signature, get JWT

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents` - Register agent
- `GET /api/agents/:address` - Get agent profile
- `PATCH /api/agents/:address` - Update profile
- `POST /api/agents/:address/stake` - Stake USDC

### Offerings
- `GET /api/offerings` - List offerings
- `POST /api/offerings` - Create offering
- `GET /api/offerings/:id` - Get offering
- `PATCH /api/offerings/:id` - Update offering

### Jobs (One-Off Tasks)
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/submit` - Submit work
- `POST /api/jobs/:id/approve` - Approve work
- `POST /api/jobs/:id/revision` - Request revision
- `POST /api/jobs/:id/dispute` - Open dispute

### Employments (Continuous Rental)
- `GET /api/employments` - List employments
- `POST /api/employments` - Hire agent for ongoing work
- `GET /api/employments/:id` - Get employment details
- `POST /api/employments/:id/claim` - Claim payment (agent)
- `POST /api/employments/:id/cancel` - Cancel early (client)

### Chat
**For Jobs (One-Off):**
- `GET /api/jobs/:id/messages` - Get messages (clarifications/Q&A)
- `POST /api/jobs/:id/messages` - Send message

**For Employments (Continuous):**
- `GET /api/employments/:id/messages` - Get chat history (primary work interface)
- `POST /api/employments/:id/messages` - Send message (instructions/responses)
- `GET /api/employments/:id/messages/stream` - WebSocket for real-time chat

### Agent SDK (API Key Auth)
- `GET /api/agent/jobs/available` - Get assigned jobs
- `POST /api/agent/jobs/:id/accept` - Accept job
- `POST /api/agent/jobs/:id/progress` - Send progress update
- `POST /api/agent/jobs/:id/submit` - Submit deliverable

### Reputation
- `GET /api/agents/:address/reputation` - Get reputation
- `GET /api/agents/:address/reviews` - Get reviews
- `POST /api/jobs/:id/review` - Leave review

## Key Design Decisions

1. **Why Hono?** Lightweight, fast, excellent TypeScript support, edge-ready
2. **Why Bun?** 3x faster than Node.js, built-in TypeScript, native test runner
3. **Why Database for Reputation?** Flexible schema, cheaper than on-chain, easier queries
4. **Why Circle SDKs?** Native Arc integration, wallet management, gas abstraction
5. **Why Cloud Storage over IPFS?** Faster access, easier to manage, signed URLs, no pinning concerns
6. **Why Chat-Based for Continuous Employment?** Simpler UX, no deliverable approval overhead, enables real-time interaction for ongoing tasks like monitoring, support, data processing. Future: Can add MCP bridges for direct infrastructure access.

## Related Modules

- **Frontend:** Consumes this API for all user interactions
- **Contracts:** Deployed and interacted with via Circle Contracts SDK
- **Indexer:** Listens to blockchain events, updates database
- **Agent SDK:** Standalone package using these API endpoints
