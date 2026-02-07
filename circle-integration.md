# Circle SDK Integration for Arc Bounty

## Required Tools (per bounty)

| Tool | What It Does | How We Use It |
|------|--------------|---------------|
| **Arc** | Circle's L1 blockchain (USDC as gas) | Deploy contracts, run transactions |
| **USDC** | Stablecoin for payments | Staking, escrow, payments |
| **Circle Wallets** | Managed wallet infrastructure | User-controlled wallets (non-custodial) |
| **Circle Contracts** | Smart contract deployment/interaction | Deploy & manage our contracts |
| **Stork** | Oracle for price feeds | Could use for agent performance metrics |

---

## 1. Arc Blockchain

**What:** Circle's L1 blockchain purpose-built for stablecoin finance.

**Key Features:**
- USDC as native gas token (no ETH needed!)
- Sub-second finality
- EVM-compatible (use Solidity, Hardhat, Foundry)
- Predictable fees in dollars

**Network Details:**
```
Arc Testnet:
- RPC: https://testnet-rpc.arc.network (or via Quicknode/Alchemy)
- Chain ID: TBD (check docs.arc.network)
- Explorer: Blockscout integration
- Faucet: Available for testnet USDC
```

**Why It's Perfect for Envoy:**
- Agents transact in USDC (no volatile gas tokens)
- Predictable costs for job execution
- Native Circle integration

---

## 2. Circle Wallets (User-Controlled / Non-Custodial)

**What:** Non-custodial wallets where users control their funds via PIN. Platform CANNOT move funds without user approval.

**Why User-Controlled (not Developer-Controlled):**
- **Trustless:** Platform cannot steal user funds
- **Non-custodial:** Users own their keys (secured by PIN)
- **Regulatory:** No custody license required
- **User confidence:** Users approve every transaction

**Trust Model Comparison:**

| Model | Who Controls Keys | Can Platform Move Funds? | User Action Required |
|-------|-------------------|--------------------------|----------------------|
| Developer-Controlled | Platform | Yes (anytime) | None |
| **User-Controlled** | User (via PIN) | **No** | PIN approval |

### Installation

**Backend:**
```bash
bun add @circle-fin/user-controlled-wallets
```

**Frontend:**
```bash
npm install @circle-fin/w3s-pw-web-sdk
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Circle W3S Web SDK                                   │ │
│  │   @circle-fin/w3s-pw-web-sdk                                           │ │
│  │                                                                         │ │
│  │   • User sets PIN on registration                                      │ │
│  │   • User enters PIN to approve transactions                            │ │
│  │   • SDK handles encryption client-side                                 │ │
│  │   • PIN never leaves the device                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                Circle User-Controlled Wallets SDK                       │ │
│  │   @circle-fin/user-controlled-wallets                                  │ │
│  │                                                                         │ │
│  │   • Create users in Circle system                                      │ │
│  │   • Generate session tokens                                            │ │
│  │   • Initiate challenges (returns challengeId)                          │ │
│  │   • CANNOT sign transactions - only user can via PIN                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SMART CONTRACTS (Arc)                               │
│                                                                              │
│   AgentRegistry          JobEscrow           AgentEmployment                │
│   (Staking)              (Escrow)            (Streaming)                    │
│                                                                              │
│   • Trustless escrow - platform cannot touch locked funds                   │
│   • Automatic payment release on approval                                   │
│   • Stake enforcement (80% capacity rule)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Challenge Flow

Every transaction requiring user approval follows this pattern:

```
1. Backend: Creates challenge → Returns challengeId
2. Frontend: Receives challengeId, prompts user
3. Frontend: User enters PIN
4. Frontend: SDK.execute(challengeId) with PIN
5. Circle: Verifies PIN, decrypts keys, signs transaction
6. Blockchain: Transaction executed on Arc
```

### Backend Setup

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
   */
  async getUserToken(userId: string) {
    const response = await this.client.createUserToken({ userId });
    return {
      userToken: response.data?.userToken,
      encryptionKey: response.data?.encryptionKey,
    };
  }

  /**
   * Initialize wallet - returns challengeId for PIN setup
   */
  async initializeUserWallet(userId: string) {
    const { userToken } = await this.getUserToken(userId);

    const response = await this.client.createUserPinWithWallets({
      userToken: userToken!,
      blockchains: ['ARC-TESTNET'],
      accountType: 'SCA',
    });

    return { challengeId: response.data?.challengeId };
  }

  /**
   * Get user's wallets
   */
  async getUserWallets(userId: string) {
    const { userToken } = await this.getUserToken(userId);
    const response = await this.client.listWallets({ userToken: userToken! });
    return response.data?.wallets;
  }

  /**
   * Initiate contract execution - returns challengeId for approval
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
   * Initiate token transfer - returns challengeId for approval
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
}

export const circleWalletService = new CircleWalletService();
```

### Frontend Setup

```typescript
// frontend/src/services/circle-wallet.ts
import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';

class CircleWalletClient {
  private sdk: W3SSdk;
  private appId: string;

  constructor() {
    this.appId = import.meta.env.VITE_CIRCLE_APP_ID;
    this.sdk = new W3SSdk();
  }

  /**
   * Configure SDK with user session
   */
  setUserSession(userToken: string, encryptionKey: string) {
    this.sdk.setAppSettings({ appId: this.appId });
    this.sdk.setAuthentication({ userToken, encryptionKey });
  }

  /**
   * Execute challenge - prompts user for PIN
   */
  executeChallenge(challengeId: string): Promise<{ type: string; status: string }> {
    return new Promise((resolve, reject) => {
      this.sdk.execute(challengeId, (error, result) => {
        if (error) reject(error);
        else resolve(result as { type: string; status: string });
      });
    });
  }
}

export const circleWallet = new CircleWalletClient();
```

---

## 3. Circle Contracts (Smart Contract Platform)

**What:** Deploy and interact with smart contracts via API.

### Installation

```bash
npm install @circle-fin/smart-contract-platform
```

### Setup

```typescript
import { initiateSmartContractPlatformClient } from '@circle-fin/smart-contract-platform';

const contractClient = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET
});
```

### Deploy Contract

```typescript
// Option 1: Deploy from bytecode
const deployResponse = await contractClient.deployContract({
  name: 'AgentRegistry',
  blockchain: 'ARC-TESTNET',
  walletId: deployerWallet.id,
  bytecode: compiledBytecode,
  abi: contractABI,
  constructorParameters: [USDC_ADDRESS]
});

// Option 2: Use Circle's templates (if applicable)
const templateResponse = await contractClient.deployContractFromTemplate({
  templateId: 'erc20-template-id',
  blockchain: 'ARC-TESTNET',
  walletId: deployerWallet.id,
  parameters: { name: 'EnvoyToken', symbol: 'ENV' }
});
```

### Interact with Contract

```typescript
// Read function (no gas)
const readResponse = await contractClient.readContract({
  contractId: agentRegistryContractId,
  abiFunctionSignature: 'getAvailableCapacity(address)',
  abiParameters: [agentAddress]
});

// Write function (requires gas)
const writeResponse = await contractClient.executeContract({
  contractId: jobEscrowContractId,
  walletId: clientWalletId,
  abiFunctionSignature: 'createJob(address,uint256,string)',
  abiParameters: [agentAddress, offeringId, requirementsIPFS]
});
```

---

## 4. Stork Oracle

**What:** Low-latency price feed oracle for DeFi.

**How We Could Use It:**
- Track USDC/USD peg (edge case handling)
- If agents run yield strategies, get asset prices
- Performance benchmarking against market indices

### Integration

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IStork {
    function getTemporalNumericValue(bytes32 assetId) 
        external view returns (uint256 value, uint256 timestamp);
}

contract EnvoyWithOracle {
    IStork public stork;
    
    // Asset ID for USDC/USD
    bytes32 constant USDC_USD = keccak256("USDCUSD");
    
    constructor(address _stork) {
        stork = IStork(_stork);
    }
    
    function getUSDCPrice() public view returns (uint256 price, uint256 timestamp) {
        return stork.getTemporalNumericValue(USDC_USD);
    }
}
```

**For Envoy MVP:** Stork integration is optional. Mention it as "future feature" for:
- Agent performance tracking against benchmarks
- Dynamic pricing based on market conditions
- Risk management for larger jobs

---

## 5. Integration Architecture for Envoy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Circle W3S Web SDK          React Components                          │ │
│  │  • PIN entry UI              • Agent registration form                 │ │
│  │  • Challenge execution       • Job creation/approval UI                │ │
│  │  • Transaction approval      • Wallet balance display                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Circle User Wallets  │  │   Circle Contracts   │  │      Stork       │  │
│  │        SDK           │  │        SDK           │  │    (Oracle)      │  │
│  │                      │  │                      │  │                  │  │
│  │ • Create users       │  │ • Deploy contracts   │  │ • Price feeds    │  │
│  │ • Generate tokens    │  │ • Read contract      │  │ • Performance    │  │
│  │ • Create challenges  │  │   state              │  │   metrics        │  │
│  │ • CANNOT sign txns   │  │                      │  │                  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│             │                         │                       │            │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              │                         │                       │
              ▼                         ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARC BLOCKCHAIN                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  AgentRegistry   │  │    JobEscrow     │  │ AgentEmployment  │          │
│  │                  │  │                  │  │                  │          │
│  │  • Staking       │  │  • Escrow funds  │  │  • Streaming     │          │
│  │  • Lock/unlock   │  │  • Auto-release  │  │    payments      │          │
│  │  • 80% capacity  │  │  • Disputes      │  │  • Yellow Net    │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│                            USDC (Native Gas Token)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Envoy-Specific Implementation

### 6.1 Agent Operator Registration Flow

When an agent operator registers their agent on Envoy, a Circle wallet is automatically created. The operator must set a PIN to secure their wallet and approve all transactions.

**Complete Flow Diagram:**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                           AGENT OPERATOR REGISTRATION FLOW                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────┐
│ Operator │     │ Frontend │     │ Backend  │     │  Circle  │     │ Arc Chain│     │  USDC  │
│          │     │  (React) │     │  (Hono)  │     │   API    │     │          │     │ Faucet │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └───┬────┘
     │                │                │                │                │               │
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │ ║                        PHASE 1: WALLET CREATION                                   ║
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │                │                │                │                │               │
     │  1. Fill form │                │                │                │               │
     │  (name, desc, │                │                │                │               │
     │   offerings)  │                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 2. POST /api/agents/register   │                │               │
     │                │   {name, description, offerings}                │               │
     │                │───────────────>│                │                │               │
     │                │                │                │                │               │
     │                │                │ 3. createUser(userId)          │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │ 4. getUserToken(userId)        │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  {userToken,   │                │               │
     │                │                │   encryptionKey}                │               │
     │                │                │                │                │               │
     │                │                │ 5. createUserPinWithWallets()  │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  {challengeId} │                │               │
     │                │                │                │                │               │
     │                │                │ 6. Store pending registration  │               │
     │                │                │   in database                  │               │
     │                │                │                │                │               │
     │                │<───────────────│                │                │               │
     │                │  {userId, userToken,            │                │               │
     │                │   encryptionKey, challengeId}   │                │               │
     │                │                │                │                │               │
     │                │ 7. sdk.setAppSettings()         │                │               │
     │                │    sdk.setAuthentication()      │                │               │
     │                │                │                │                │               │
     │  8. Circle SDK│                │                │                │               │
     │  opens PIN    │                │                │                │               │
     │  setup modal  │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     │  9. Operator  │                │                │                │               │
     │  sets 6-digit │                │                │                │               │
     │  PIN          │                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 10. sdk.execute(challengeId)    │                │               │
     │                │────────────────────────────────>│                │               │
     │                │                │                │                │               │
     │                │                │                │  11. Create    │               │
     │                │                │                │  wallet on Arc │               │
     │                │                │                │───────────────>│               │
     │                │                │                │                │               │
     │                │                │                │<───────────────│               │
     │                │                │                │  {walletAddress}               │
     │                │                │                │                │               │
     │                │<────────────────────────────────│                │               │
     │                │  {type: 'INITIALIZE',           │                │               │
     │                │   status: 'COMPLETE'}           │                │               │
     │                │                │                │                │               │
     │                │ 12. POST /api/agents/register/complete          │               │
     │                │   {userId}     │                │                │               │
     │                │───────────────>│                │                │               │
     │                │                │                │                │               │
     │                │                │ 13. getUserWallets(userId)     │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  [{id, address}]               │               │
     │                │                │                │                │               │
     │                │                │ 14. Create agent record        │               │
     │                │                │   in database with             │               │
     │                │                │   circleWalletId,              │               │
     │                │                │   circleWalletAddress          │               │
     │                │                │   isActive: false              │               │
     │                │                │                │                │               │
     │                │<───────────────│                │                │               │
     │                │  {walletAddress}                │                │               │
     │                │                │                │                │               │
     │  15. Show     │                │                │                │               │
     │  wallet addr  │                │                │                │               │
     │  "Deposit USDC│                │                │                │               │
     │   to stake"   │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │ ║                        PHASE 2: FUND WALLET                                       ║
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │                │                │                │                │               │
     │  16. Request  │                │                │                │               │
     │  testnet USDC │                │                │                │               │
     │────────────────────────────────────────────────────────────────────────────────────>│
     │                │                │                │                │               │
     │<────────────────────────────────────────────────────────────────────────────────────│
     │  USDC sent to │                │                │                │               │
     │  wallet       │                │                │                │               │
     │                │                │                │                │               │
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │ ║                        PHASE 3: STAKE & ACTIVATE                                  ║
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │                │                │                │                │               │
     │  17. Click    │                │                │                │               │
     │  "Stake $50"  │                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 18. POST /api/agents/:id/stake  │                │               │
     │                │   {amount: "50000000"}          │                │               │
     │                │───────────────>│                │                │               │
     │                │                │                │                │               │
     │                │                │ 19. createContractExecutionChallenge()          │
     │                │                │   USDC.approve(AgentRegistry, amount)           │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  {challengeId} │                │               │
     │                │                │                │                │               │
     │                │<───────────────│                │                │               │
     │                │  {userToken, encryptionKey,     │                │               │
     │                │   challengeId, step: 'approval'}│                │               │
     │                │                │                │                │               │
     │  20. PIN      │                │                │                │               │
     │  prompt:      │                │                │                │               │
     │  "Approve USDC│                │                │                │               │
     │   spending"   │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     │  21. Enter PIN│                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 22. sdk.execute(challengeId)    │                │               │
     │                │────────────────────────────────>│                │               │
     │                │                │                │                │               │
     │                │                │                │  23. Sign &    │               │
     │                │                │                │  broadcast     │               │
     │                │                │                │  USDC.approve()│               │
     │                │                │                │───────────────>│               │
     │                │                │                │                │               │
     │                │                │                │<───────────────│               │
     │                │                │                │  {txHash}      │               │
     │                │                │                │                │               │
     │                │<────────────────────────────────│                │               │
     │                │  {status: 'COMPLETE'}           │                │               │
     │                │                │                │                │               │
     │                │ 24. POST /api/agents/:id/stake/execute          │               │
     │                │   {amount: "50000000", agentName}                │               │
     │                │───────────────>│                │                │               │
     │                │                │                │                │               │
     │                │                │ 25. createContractExecutionChallenge()          │
     │                │                │   AgentRegistry.stake(amount, name)             │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  {challengeId} │                │               │
     │                │                │                │                │               │
     │                │<───────────────│                │                │               │
     │                │  {userToken, encryptionKey,     │                │               │
     │                │   challengeId, step: 'stake'}   │                │               │
     │                │                │                │                │               │
     │  26. PIN      │                │                │                │               │
     │  prompt:      │                │                │                │               │
     │  "Confirm     │                │                │                │               │
     │   staking"    │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     │  27. Enter PIN│                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 28. sdk.execute(challengeId)    │                │               │
     │                │────────────────────────────────>│                │               │
     │                │                │                │                │               │
     │                │                │                │  29. Sign &    │               │
     │                │                │                │  broadcast     │               │
     │                │                │                │  stake()       │               │
     │                │                │                │───────────────>│               │
     │                │                │                │                │               │
     │                │                │                │      ┌─────────────────────┐   │
     │                │                │                │      │  AgentRegistry      │   │
     │                │                │                │      │  Contract           │   │
     │                │                │                │      │                     │   │
     │                │                │                │      │  • Transfer USDC    │   │
     │                │                │                │      │    from wallet      │   │
     │                │                │                │      │  • Record stake     │   │
     │                │                │                │      │  • Create ENS       │   │
     │                │                │                │      │    subdomain        │   │
     │                │                │                │      │  • Emit event       │   │
     │                │                │                │      └─────────────────────┘   │
     │                │                │                │                │               │
     │                │                │                │<───────────────│               │
     │                │                │                │  {txHash}      │               │
     │                │                │                │                │               │
     │                │<────────────────────────────────│                │               │
     │                │  {status: 'COMPLETE'}           │                │               │
     │                │                │                │                │               │
     │                │                │ 30. Indexer picks up            │               │
     │                │                │   AgentRegistered event         │               │
     │                │                │   Updates database:             │               │
     │                │                │   isActive: true                │               │
     │                │                │   totalStaked: amount           │               │
     │                │                │                │                │               │
     │  31. Show     │                │                │                │               │
     │  "Agent       │                │                │                │               │
     │   Registered! │                │                │                │               │
     │   ENS: name   │                │                │                │               │
     │   bot.envoy   │                │                │                │               │
     │   .eth"       │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     ▼                ▼                ▼                ▼                ▼               ▼

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    REGISTRATION COMPLETE                                      │
│                                                                                              │
│  Agent now has:                                                                              │
│  ✅ Circle Wallet (non-custodial, PIN-protected)                                             │
│  ✅ $50 USDC staked in AgentRegistry contract                                                │
│  ✅ ENS subdomain: {name}bot.envoy.eth                                                       │
│  ✅ isActive: true - visible in marketplace                                                  │
│  ✅ Available capacity: $40 (80% of $50 stake)                                               │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Backend Implementation:**

```typescript
// backend/src/routes/agents.ts
import { Hono } from 'hono';
import { circleWalletService } from '../services/circle-wallet.service';
import { db } from '../db';

const agentRoutes = new Hono();

/**
 * POST /api/agents/register
 * Step 1: Initialize agent registration - creates Circle user and wallet
 */
agentRoutes.post('/register', async (c) => {
  const { agentName, description, offerings } = await c.req.json();
  
  // Generate unique user ID for this agent operator
  const userId = `agent_${crypto.randomUUID()}`;
  
  // 1. Create user in Circle
  await circleWalletService.createUser(userId);
  
  // 2. Get session credentials for frontend
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(userId);
  
  // 3. Initialize wallet (returns challenge for PIN setup)
  const { challengeId } = await circleWalletService.initializeUserWallet(userId);
  
  // 4. Store pending registration in database
  await db.insert(pendingAgentRegistrations).values({
    id: userId,
    agentName,
    description,
    offerings: JSON.stringify(offerings),
    status: 'pending_wallet',
    createdAt: new Date(),
  });
  
  return c.json({
    userId,
    userToken,
    encryptionKey,
    challengeId,  // Frontend uses this to prompt PIN setup
    message: 'Complete wallet setup by setting your PIN',
  });
});

/**
 * POST /api/agents/register/complete
 * Step 2: Complete registration after wallet is created
 */
agentRoutes.post('/register/complete', async (c) => {
  const { userId } = await c.req.json();
  
  // 1. Get the wallet that was just created
  const wallets = await circleWalletService.getUserWallets(userId);
  const wallet = wallets?.[0];
  
  if (!wallet) {
    return c.json({ error: 'Wallet not found. Please complete PIN setup.' }, 400);
  }
  
  // 2. Update registration with wallet info
  const pending = await db.query.pendingAgentRegistrations.findFirst({
    where: (t, { eq }) => eq(t.id, userId),
  });
  
  // 3. Create agent record
  await db.insert(agents).values({
    id: crypto.randomUUID(),
    circleUserId: userId,
    circleWalletId: wallet.id,
    circleWalletAddress: wallet.address,
    name: pending.agentName,
    description: pending.description,
    ensName: `${pending.agentName}bot.envoy.eth`,
    totalStaked: 0n,
    lockedStake: 0n,
    isActive: false,  // Not active until staked
    registeredAt: new Date(),
  });
  
  // 4. Clean up pending registration
  await db.delete(pendingAgentRegistrations).where(eq(pendingAgentRegistrations.id, userId));
  
  return c.json({
    success: true,
    walletAddress: wallet.address,
    message: 'Wallet created! Deposit USDC and stake to activate your agent.',
  });
});

/**
 * POST /api/agents/:id/stake
 * Stake USDC to activate agent - requires PIN approval
 */
agentRoutes.post('/:id/stake', async (c) => {
  const agentId = c.req.param('id');
  const { amount, agentName } = await c.req.json();
  
  // 1. Get agent info
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId),
  });
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  // 2. Get fresh session token
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(agent.circleUserId);
  
  // 3. Create USDC approval challenge (approve AgentRegistry to spend USDC)
  const { challengeId: approvalChallengeId } = await circleWalletService.initiateContractExecution(
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
    challengeId: approvalChallengeId,
    nextStep: `/api/agents/${agentId}/stake/execute`,
    message: 'Approve USDC spending by entering your PIN',
  });
});

/**
 * POST /api/agents/:id/stake/execute
 * Execute the stake after approval - requires PIN approval
 */
agentRoutes.post('/:id/stake/execute', async (c) => {
  const agentId = c.req.param('id');
  const { amount, agentName } = await c.req.json();
  
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId),
  });
  
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

export default agentRoutes;
```

**Frontend Implementation:**

```tsx
// frontend/src/components/AgentRegistration.tsx
import { useState } from 'react';
import { circleWallet } from '../services/circle-wallet';

type RegistrationStep = 
  | 'form' 
  | 'creating_wallet' 
  | 'wallet_created' 
  | 'depositing'
  | 'approving_usdc'
  | 'staking'
  | 'complete';

export function AgentRegistration() {
  const [step, setStep] = useState<RegistrationStep>('form');
  const [agentData, setAgentData] = useState({ name: '', description: '' });
  const [userId, setUserId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Submit registration form
  const handleSubmitForm = async () => {
    setStep('creating_wallet');
    setError(null);

    try {
      // Call backend to create Circle user and get challenge
      const response = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      });
      const { userId, userToken, encryptionKey, challengeId } = await response.json();
      
      setUserId(userId);

      // Configure SDK and execute PIN setup challenge
      circleWallet.setUserSession(userToken, encryptionKey);
      
      // This opens Circle's PIN setup UI
      await circleWallet.executeChallenge(challengeId);
      
      // Complete registration
      const completeResponse = await fetch('/api/agents/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const { walletAddress } = await completeResponse.json();
      
      setWalletAddress(walletAddress);
      setStep('wallet_created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStep('form');
    }
  };

  // Step 2: Stake USDC (after user deposits)
  const handleStake = async (amount: string) => {
    setStep('approving_usdc');
    setError(null);

    try {
      // Get approval challenge
      const approvalResponse = await fetch(`/api/agents/${userId}/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, agentName: agentData.name }),
      });
      const approval = await approvalResponse.json();

      // Execute USDC approval (user enters PIN)
      circleWallet.setUserSession(approval.userToken, approval.encryptionKey);
      await circleWallet.executeChallenge(approval.challengeId);

      setStep('staking');

      // Get stake challenge
      const stakeResponse = await fetch(`/api/agents/${userId}/stake/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, agentName: agentData.name }),
      });
      const stake = await stakeResponse.json();

      // Execute stake (user enters PIN again)
      circleWallet.setUserSession(stake.userToken, stake.encryptionKey);
      await circleWallet.executeChallenge(stake.challengeId);

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Staking failed');
      setStep('wallet_created');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      {step === 'form' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Register Your Agent</h2>
          <input
            type="text"
            placeholder="Agent Name"
            value={agentData.name}
            onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
            className="w-full p-2 border rounded mb-4"
          />
          <textarea
            placeholder="Description"
            value={agentData.description}
            onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={handleSubmitForm}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Create Agent & Wallet
          </button>
          <p className="text-sm text-gray-500 mt-2">
            You'll be asked to set a PIN to secure your wallet.
          </p>
        </div>
      )}

      {step === 'creating_wallet' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Creating Your Wallet</h2>
          <p>Please set your PIN when prompted...</p>
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mt-4" />
        </div>
      )}

      {step === 'wallet_created' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Wallet Created!</h2>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p className="text-sm text-gray-600">Your wallet address:</p>
            <p className="font-mono text-sm break-all">{walletAddress}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded mb-4">
            <p className="font-semibold">Next: Deposit USDC</p>
            <p className="text-sm">
              Send at least $50 USDC to your wallet address to stake and activate your agent.
            </p>
          </div>
          <button
            onClick={() => handleStake('50000000')} // $50 USDC (6 decimals)
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Stake $50 USDC
          </button>
          <p className="text-sm text-gray-500 mt-2">
            You'll need to approve the transaction with your PIN.
          </p>
        </div>
      )}

      {(step === 'approving_usdc' || step === 'staking') && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {step === 'approving_usdc' ? 'Approving USDC...' : 'Staking...'}
          </h2>
          <p>Please enter your PIN when prompted.</p>
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mt-4" />
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-600">Agent Registered!</h2>
          <p>Your agent is now active on Envoy.</p>
          <p className="text-sm text-gray-500 mt-2">
            ENS: {agentData.name}bot.envoy.eth
          </p>
        </div>
      )}
    </div>
  );
}
```

### 6.2 Client Registration Flow

Clients also get a Circle wallet when they sign up. This allows them to:
- Deposit USDC to pay for jobs
- Approve job payments
- Receive refunds if jobs are cancelled

**Complete Flow Diagram:**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT REGISTRATION FLOW                                         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────┐
│  Client  │     │ Frontend │     │ Backend  │     │  Circle  │     │ Arc Chain│     │  USDC  │
│          │     │  (React) │     │  (Hono)  │     │   API    │     │          │     │ Faucet │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └───┬────┘
     │                │                │                │                │               │
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │ ║                        PHASE 1: WALLET CREATION                                   ║
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │                │                │                │                │               │
     │  1. Fill      │                │                │                │               │
     │  signup form  │                │                │                │               │
     │  (email, name)│                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 2. POST /api/clients/register   │                │               │
     │                │   {email, name}│                │                │               │
     │                │───────────────>│                │                │               │
     │                │                │                │                │               │
     │                │                │ 3. createUser(userId)          │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │ 4. getUserToken(userId)        │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  {userToken,   │                │               │
     │                │                │   encryptionKey}                │               │
     │                │                │                │                │               │
     │                │                │ 5. createUserPinWithWallets()  │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  {challengeId} │                │               │
     │                │                │                │                │               │
     │                │                │ 6. Store client record         │               │
     │                │                │   status: 'pending_wallet'     │               │
     │                │                │                │                │               │
     │                │<───────────────│                │                │               │
     │                │  {userId, userToken,            │                │               │
     │                │   encryptionKey, challengeId}   │                │               │
     │                │                │                │                │               │
     │                │ 7. sdk.setAppSettings()         │                │               │
     │                │    sdk.setAuthentication()      │                │               │
     │                │                │                │                │               │
     │  8. Circle SDK│                │                │                │               │
     │  opens PIN    │                │                │                │               │
     │  setup modal  │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     │  9. Client    │                │                │                │               │
     │  sets 6-digit │                │                │                │               │
     │  PIN          │                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 10. sdk.execute(challengeId)    │                │               │
     │                │────────────────────────────────>│                │               │
     │                │                │                │                │               │
     │                │                │                │  11. Create    │               │
     │                │                │                │  wallet on Arc │               │
     │                │                │                │───────────────>│               │
     │                │                │                │                │               │
     │                │                │                │<───────────────│               │
     │                │                │                │  {walletAddress}               │
     │                │                │                │                │               │
     │                │<────────────────────────────────│                │               │
     │                │  {type: 'INITIALIZE',           │                │               │
     │                │   status: 'COMPLETE'}           │                │               │
     │                │                │                │                │               │
     │                │ 12. POST /api/clients/register/complete         │               │
     │                │   {userId}     │                │                │               │
     │                │───────────────>│                │                │               │
     │                │                │                │                │               │
     │                │                │ 13. getUserWallets(userId)     │               │
     │                │                │───────────────>│                │               │
     │                │                │                │                │               │
     │                │                │<───────────────│                │               │
     │                │                │  [{id, address}]               │               │
     │                │                │                │                │               │
     │                │                │ 14. Update client record       │               │
     │                │                │   circleWalletId               │               │
     │                │                │   circleWalletAddress          │               │
     │                │                │   status: 'active'             │               │
     │                │                │                │                │               │
     │                │<───────────────│                │                │               │
     │                │  {walletAddress}                │                │               │
     │                │                │                │                │               │
     │  15. Show     │                │                │                │               │
     │  wallet addr  │                │                │                │               │
     │  "Deposit USDC│                │                │                │               │
     │   to hire     │                │                │                │               │
     │   agents"     │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │ ║                        PHASE 2: FUND WALLET                                       ║
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │                │                │                │                │               │
     │  16. Request  │                │                │                │               │
     │  testnet USDC │                │                │                │               │
     │  (or transfer │                │                │                │               │
     │   from exchange)               │                │                │               │
     │────────────────────────────────────────────────────────────────────────────────────>│
     │                │                │                │                │               │
     │<────────────────────────────────────────────────────────────────────────────────────│
     │  USDC sent to │                │                │                │               │
     │  wallet       │                │                │                │               │
     │                │                │                │                │               │
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │ ║                        PHASE 3: READY TO HIRE AGENTS                              ║
     │ ══════════════════════════════════════════════════════════════════════════════════════
     │                │                │                │                │               │
     │  17. Browse   │                │                │                │               │
     │  marketplace  │                │                │                │               │
     │───────────────>│                │                │                │               │
     │                │                │                │                │               │
     │                │ 18. GET /api/agents             │                │               │
     │                │───────────────>│                │                │               │
     │                │                │                │                │               │
     │                │<───────────────│                │                │               │
     │                │  [{agents with offerings}]      │                │               │
     │                │                │                │                │               │
     │  19. Display  │                │                │                │               │
     │  available    │                │                │                │               │
     │  agents       │                │                │                │               │
     │<───────────────│                │                │                │               │
     │                │                │                │                │               │
     ▼                ▼                ▼                ▼                ▼               ▼

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    REGISTRATION COMPLETE                                      │
│                                                                                              │
│  Client now has:                                                                             │
│  ✅ Circle Wallet (non-custodial, PIN-protected)                                             │
│  ✅ USDC balance for hiring agents                                                           │
│  ✅ Can browse marketplace                                                                   │
│  ✅ Ready to create jobs                                                                     │
│                                                                                              │
│  To hire an agent, client will:                                                              │
│  1. Select agent & offering                                                                  │
│  2. Describe job requirements                                                                │
│  3. Enter PIN to approve payment → Funds locked in JobEscrow contract                        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Side-by-Side Comparison:**

| Step | Agent Operator | Client |
|------|----------------|--------|
| **1. Signup Form** | Name, description, offerings | Email, name |
| **2. Create Circle User** | ✅ Same | ✅ Same |
| **3. Set PIN** | ✅ Same | ✅ Same |
| **4. Wallet Created** | ✅ Same | ✅ Same |
| **5. Fund Wallet** | Deposit USDC | Deposit USDC |
| **6. Activation** | Must stake $50+ USDC | Ready immediately |
| **7. On-Chain** | AgentRegistry.stake() | (No on-chain action) |
| **8. Result** | Listed in marketplace | Can hire agents |

**Key Differences:**

| Aspect | Agent Operator | Client |
|--------|----------------|--------|
| **Staking Required** | Yes ($50 minimum) | No |
| **PIN Prompts** | 3 (setup + approve + stake) | 1 (setup only) |
| **Smart Contract Interaction** | Yes (AgentRegistry) | Only when creating jobs |
| **ENS Subdomain** | Yes ({name}bot.envoy.eth) | No |
| **Active Status** | After staking | Immediately |

**Backend Implementation:**

```typescript
// backend/src/routes/clients.ts
clientRoutes.post('/register', async (c) => {
  const { email, name } = await c.req.json();
  
  const userId = `client_${crypto.randomUUID()}`;
  
  // Create Circle user and wallet
  await circleWalletService.createUser(userId);
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(userId);
  const { challengeId } = await circleWalletService.initializeUserWallet(userId);
  
  // Store client record
  await db.insert(clients).values({
    id: crypto.randomUUID(),
    circleUserId: userId,
    email,
    name,
    status: 'pending_wallet',
  });
  
  return c.json({
    userId,
    userToken,
    encryptionKey,
    challengeId,
  });
});

clientRoutes.post('/register/complete', async (c) => {
  const { userId } = await c.req.json();
  
  // Get the wallet that was just created
  const wallets = await circleWalletService.getUserWallets(userId);
  const wallet = wallets?.[0];
  
  if (!wallet) {
    return c.json({ error: 'Wallet not found. Please complete PIN setup.' }, 400);
  }
  
  // Update client record with wallet info
  await db.update(clients)
    .set({
      circleWalletId: wallet.id,
      circleWalletAddress: wallet.address,
      status: 'active',
    })
    .where(eq(clients.circleUserId, userId));
  
  return c.json({
    success: true,
    walletAddress: wallet.address,
    message: 'Wallet created! Deposit USDC to start hiring agents.',
  });
});
```

### 6.3 Job Creation Flow (Client Pays)

```typescript
// Backend: Create job challenge
jobRoutes.post('/', async (c) => {
  const { clientId, agentAddress, offeringId, requirements, price } = await c.req.json();
  
  const client = await db.query.clients.findFirst({
    where: (t, { eq }) => eq(t.id, clientId),
  });
  
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(client.circleUserId);
  
  // Create job via smart contract - locks payment in escrow
  const { challengeId } = await circleWalletService.initiateContractExecution(
    client.circleUserId,
    client.circleWalletId,
    process.env.JOB_ESCROW_ADDRESS!,
    'createJob(address,uint256,string,uint256,uint8)',
    [agentAddress, offeringId, requirements, price, 2] // 2 revisions
  );
  
  return c.json({
    userToken,
    encryptionKey,
    challengeId,
    message: 'Approve job payment by entering your PIN',
  });
});
```

### 6.4 Job Completion Flow (Payment Release)

```typescript
// Backend: Client approves job - releases payment to agent
jobRoutes.post('/:id/approve', async (c) => {
  const jobId = c.req.param('id');
  const { clientId } = await c.req.json();
  
  const client = await db.query.clients.findFirst({
    where: (t, { eq }) => eq(t.id, clientId),
  });
  
  const { userToken, encryptionKey } = await circleWalletService.getUserToken(client.circleUserId);
  
  // Approve via smart contract - automatically releases payment to agent
  const { challengeId } = await circleWalletService.initiateContractExecution(
    client.circleUserId,
    client.circleWalletId,
    process.env.JOB_ESCROW_ADDRESS!,
    'approve(uint256)',
    [jobId]
  );
  
  return c.json({
    userToken,
    encryptionKey,
    challengeId,
    message: 'Approve job completion by entering your PIN',
  });
});
```

### 6.5 Agent Withdrawal Flow

Agents can withdraw their earnings to any external address:

```typescript
// Backend: Agent withdraws to external address
agentRoutes.post('/:id/withdraw', async (c) => {
  const agentId = c.req.param('id');
  const { toAddress, amount } = await c.req.json();
  
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId),
  });
  
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
```

---

## 7. Database Schema

```sql
-- Pending agent registrations (before wallet setup complete)
CREATE TABLE pending_agent_registrations (
    id VARCHAR(100) PRIMARY KEY,           -- Circle user ID
    agent_name VARCHAR(100) NOT NULL,
    description TEXT,
    offerings JSONB,
    status VARCHAR(20) DEFAULT 'pending_wallet',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registered agents with Circle wallets
CREATE TABLE agents (
    id UUID PRIMARY KEY,
    circle_user_id VARCHAR(100) UNIQUE NOT NULL,
    circle_wallet_id VARCHAR(100) UNIQUE NOT NULL,
    circle_wallet_address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    ens_name VARCHAR(100),
    total_staked BIGINT DEFAULT 0,
    locked_stake BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registered clients with Circle wallets
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    circle_user_id VARCHAR(100) UNIQUE NOT NULL,
    circle_wallet_id VARCHAR(100),
    circle_wallet_address VARCHAR(42),
    email VARCHAR(255),
    name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending_wallet',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment/withdrawal transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY,
    user_type VARCHAR(10) NOT NULL,        -- 'agent' or 'client'
    user_id UUID NOT NULL,
    circle_transaction_id VARCHAR(100),
    tx_hash VARCHAR(66),
    direction VARCHAR(10) NOT NULL,        -- 'in' or 'out'
    amount BIGINT NOT NULL,
    destination_address VARCHAR(42),
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'complete', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Environment Setup

### Required Environment Variables

```env
# Circle SDK (User-Controlled Wallets)
CIRCLE_API_KEY=your_api_key

# Circle App ID (for frontend SDK)
VITE_CIRCLE_APP_ID=your_app_id

# Arc Network
ARC_RPC_URL=https://testnet-rpc.arc.network
ARC_CHAIN_ID=16180  # Check docs for actual testnet chain ID

# Contract Addresses (after deployment)
USDC_ADDRESS=0x...
USDC_TOKEN_ID=...                          # Circle token ID for USDC on Arc
AGENT_REGISTRY_ADDRESS=0x...
JOB_ESCROW_ADDRESS=0x...
AGENT_EMPLOYMENT_ADDRESS=0x...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/envoy

# Stork Oracle (optional)
STORK_CONTRACT_ADDRESS=0x...
```

### Getting Started

1. **Create Circle Developer Account:** https://console.circle.com
2. **Create App:** In console → Apps → Create new app for User-Controlled Wallets
3. **Get App ID:** Copy the App ID for frontend SDK
4. **Generate API Key:** In console → API Keys
5. **Get Testnet USDC:** Use Arc testnet faucet
6. **Deploy Contracts:** Via Circle Contracts SDK or Hardhat
7. **Get USDC Token ID:** Query Circle API for token ID on Arc blockchain

---

## 9. Bounty Alignment Checklist

### Arc Agentic Commerce ($2,500)

| Requirement | How We Meet It |
|-------------|----------------|
| AI agents that borrow, repay, or rebalance | Agents stake USDC, earn from jobs, can withdraw to any address |
| Autonomous spending, payments, or treasury | Agents receive automatic payments via smart contract escrow |
| USDC-denominated credit or cash flow | All transactions in USDC on Arc |
| Clear agent decision logic | Agent SDK handles job polling, submission, chat |
| Real-world assets (RWA) | *Stretch:* Stakes could earn T-bill yield while idle |

### Required Tools ✓

- [x] **Arc** - Deploy on Arc testnet
- [x] **USDC** - All payments in USDC (native gas token)
- [x] **Circle Wallets** - User-controlled wallets (non-custodial, PIN-protected)
- [x] **Circle Contracts** - Deploy & interact with smart contracts
- [x] **Stork** - *Optional:* Price feeds for future features

### Trust Model ✓

| Component | Trust Model | User Protection |
|-----------|-------------|-----------------|
| Circle Wallets | Non-custodial | PIN required for all transactions |
| Smart Contracts | Trustless | Escrow enforced by code |
| Platform | Cannot steal funds | Only creates challenges, cannot sign |

---

## 10. Complete API Reference

### Wallet Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/agents/register` | POST | Start agent registration, create wallet | None |
| `/api/agents/register/complete` | POST | Complete registration after PIN setup | None |
| `/api/agents/:id/stake` | POST | Initiate staking (returns challenge) | JWT |
| `/api/agents/:id/stake/execute` | POST | Execute stake after approval | JWT |
| `/api/agents/:id/withdraw` | POST | Withdraw to external address | JWT |
| `/api/agents/:id/balance` | GET | Get wallet balance | JWT |
| `/api/clients/register` | POST | Register client with wallet | None |

### Challenge Types

| Challenge | When Used | User Action |
|-----------|-----------|-------------|
| `INITIALIZE` | First-time wallet setup | Set PIN |
| `CREATE_TRANSACTION` | Token transfers | Enter PIN |
| `CONTRACT_EXECUTION` | Smart contract calls | Enter PIN |
| `SIGN_MESSAGE` | Message signing | Enter PIN |

---

## 11. Demo Script Outline

### 1. Agent Operator Registration (Live Demo)

```
NARRATOR: "Let's register an AI agent on Envoy."

ACTION: Fill out agent registration form
- Name: "ResearchBot"  
- Description: "AI research assistant"

ACTION: Submit form
SCREEN: "Creating your wallet... Please set your PIN"

ACTION: User sets 6-digit PIN in Circle SDK modal
SCREEN: "Wallet created! Address: 0x..."

NARRATOR: "The agent operator now has a non-custodial Circle wallet. 
          They control all funds with their PIN - Envoy cannot access it."

ACTION: Show wallet address, mention testnet faucet for USDC

ACTION: Click "Stake $50 USDC"
SCREEN: "Approve USDC spending - Enter PIN"
ACTION: Enter PIN
SCREEN: "Confirm staking - Enter PIN"  
ACTION: Enter PIN

SCREEN: "Agent Registered! ENS: researchbot.envoy.eth"

NARRATOR: "The agent is now active. Their $50 stake is locked in the 
          AgentRegistry smart contract - trustlessly enforced."
```

### 2. Client Hires Agent

```
ACTION: Client browses marketplace, selects ResearchBot
ACTION: Creates job for $25, describes requirements
SCREEN: "Confirm payment - Enter PIN"
ACTION: Client enters PIN

NARRATOR: "The $25 is now locked in the JobEscrow smart contract.
          Neither Envoy nor the client can withdraw it - only the 
          smart contract can release it upon job completion."
```

### 3. Job Completion & Payment

```
ACTION: Agent submits deliverable
ACTION: Client reviews and approves
SCREEN: "Release payment - Enter PIN"
ACTION: Client enters PIN

NARRATOR: "The smart contract automatically transfers $25 USDC to 
          the agent's Circle wallet. No manual intervention needed."

ACTION: Show agent's wallet balance increased
```

### 4. Agent Withdraws Earnings

```
ACTION: Agent clicks "Withdraw"
ACTION: Enters external address and amount
SCREEN: "Confirm withdrawal - Enter PIN"
ACTION: Enter PIN

NARRATOR: "The agent can withdraw their earnings to any address.
          They're in full control of their funds."
```

### 5. Key Points to Highlight

```
SLIDE: "Why This Architecture?"

✅ Non-Custodial: Users control funds via PIN
✅ Trustless: Smart contracts enforce escrow rules  
✅ No Custody License: Platform never holds user funds
✅ USDC Native: Predictable gas fees on Arc
✅ Seamless UX: Circle handles wallet complexity
```

---

## 12. Security Considerations

### PIN Security
- PIN is never transmitted to Envoy backend
- Encryption happens client-side in Circle SDK
- Circle uses secure enclaves for key storage

### Smart Contract Security
- ReentrancyGuard on all payment functions
- Checks-effects-interactions pattern
- Minimum stake requirements
- Auto-approve timeout (7 days) prevents fund lockup

### Platform Limitations (By Design)
- Backend can ONLY create challenges
- Backend CANNOT sign transactions
- Backend CANNOT access user funds
- All fund movements require user PIN approval