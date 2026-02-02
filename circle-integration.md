# Circle SDK Integration for Arc Bounty

## Required Tools (per bounty)

| Tool | What It Does | How We Use It |
|------|--------------|---------------|
| **Arc** | Circle's L1 blockchain (USDC as gas) | Deploy contracts, run transactions |
| **USDC** | Stablecoin for payments | Staking, escrow, payments |
| **Circle Wallets** | Managed wallet infrastructure | Agent wallets (developer-controlled) |
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

## 2. Circle Wallets (Developer-Controlled)

**What:** Custodial wallets you control programmatically. Perfect for agent wallets.

**Why Use It:**
- Each agent gets a Circle-managed wallet
- No private key management headaches
- Built-in transaction signing
- Gas abstraction via Gas Station

### Installation

```bash
npm install @circle-fin/developer-controlled-wallets
```

### Setup

```typescript
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET
});
```

### Create Wallet Set (for organizing agent wallets)

```typescript
const walletSetResponse = await circleClient.createWalletSet({
  name: 'Envoy Agent Wallets'
});

const walletSetId = walletSetResponse.data?.walletSet?.id;
```

### Create Agent Wallet

```typescript
const walletResponse = await circleClient.createWallets({
  blockchains: ['ARC-TESTNET'], // or appropriate Arc chain ID
  count: 1,
  walletSetId: walletSetId
});

const agentWallet = walletResponse.data?.wallets?.[0];
console.log('Agent wallet address:', agentWallet?.address);
```

### Send Transaction (Agent pays for job)

```typescript
const txResponse = await circleClient.createContractExecutionTransaction({
  walletId: agentWallet.id,
  contractAddress: JOB_ESCROW_ADDRESS,
  abiFunctionSignature: 'submit(uint256,string)',
  abiParameters: [jobId, deliverableIPFS],
  fee: {
    type: 'level',
    config: { feeLevel: 'MEDIUM' }
  }
});
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
┌─────────────────────────────────────────────────────────────────────┐
│                         ENVOY BACKEND                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │ Circle Wallets  │    │ Circle Contracts│    │     Stork       │ │
│  │     SDK         │    │      SDK        │    │    (Oracle)     │ │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘ │
│           │                      │                      │          │
│           ▼                      ▼                      ▼          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Arc Blockchain                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │AgentRegistry │  │  JobEscrow   │  │  Reputation  │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                          │                                  │   │
│  │                          ▼                                  │   │
│  │                    USDC (Native)                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Envoy-Specific Implementation

### Agent Registration Flow

```typescript
// 1. Create Circle wallet for agent
const agentWallet = await circleClient.createWallets({
  blockchains: ['ARC-TESTNET'],
  count: 1,
  walletSetId: AGENT_WALLET_SET_ID
});

// 2. Agent deposits USDC to their wallet (from external source)
// ... (user transfers USDC to agentWallet.address)

// 3. Agent stakes via contract
const stakeResponse = await contractClient.executeContract({
  contractId: AGENT_REGISTRY_CONTRACT_ID,
  walletId: agentWallet.data.wallets[0].id,
  abiFunctionSignature: 'stake(uint256)',
  abiParameters: [stakeAmount] // e.g., 100000000 for $100 USDC (6 decimals)
});
```

### Job Creation Flow

```typescript
// 1. Client creates job (locks escrow)
const createJobResponse = await contractClient.executeContract({
  contractId: JOB_ESCROW_CONTRACT_ID,
  walletId: clientWalletId,
  abiFunctionSignature: 'createJob(address,uint256,string)',
  abiParameters: [agentAddress, offeringId, requirementsIPFS]
});

// 2. Contract locks agent's stake + client's payment
// ... (handled in smart contract)

// 3. Job starts automatically (auto-accept)
```

### Job Completion Flow

```typescript
// 1. Agent submits work
const submitResponse = await contractClient.executeContract({
  contractId: JOB_ESCROW_CONTRACT_ID,
  walletId: agentWalletId,
  abiFunctionSignature: 'submit(uint256,string)',
  abiParameters: [jobId, deliverableIPFS]
});

// 2. Client approves
const approveResponse = await contractClient.executeContract({
  contractId: JOB_ESCROW_CONTRACT_ID,
  walletId: clientWalletId,
  abiFunctionSignature: 'approve(uint256)',
  abiParameters: [jobId]
});

// 3. Contract releases payment to agent, unlocks stake
```

---

## 7. Environment Setup

### Required API Keys

```env
# Circle Developer Console
CIRCLE_API_KEY=your_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret

# Arc Network
ARC_RPC_URL=https://testnet-rpc.arc.network
ARC_CHAIN_ID=16180  # Check docs for actual testnet chain ID

# Contract Addresses (after deployment)
USDC_ADDRESS=0x...
AGENT_REGISTRY_ADDRESS=0x...
JOB_ESCROW_ADDRESS=0x...
REPUTATION_ADDRESS=0x...

# Stork Oracle (if using)
STORK_CONTRACT_ADDRESS=0x...
```

### Getting Started

1. **Create Circle Developer Account:** https://console.circle.com
2. **Generate API Key:** In console → API Keys
3. **Register Entity Secret:** Follow quickstart guide
4. **Get Testnet USDC:** Use Arc testnet faucet
5. **Deploy Contracts:** Via Circle Contracts SDK or Hardhat

---

## 8. Bounty Alignment Checklist

### Arc Agentic Commerce ($2,500)

| Requirement | How We Meet It |
|-------------|----------------|
| AI agents that borrow, repay, or rebalance | Agents stake USDC, earn from jobs, can withdraw |
| Autonomous spending, payments, or treasury | Agents auto-accept jobs, submit work, receive payment |
| USDC-denominated credit or cash flow | All transactions in USDC |
| Clear agent decision logic | Agent SDK handles job polling, submission, chat |
| Real-world assets (RWA) | *Stretch:* Stakes could earn T-bill yield while idle |

### Required Tools ✓

- [x] **Arc** - Deploy on Arc testnet
- [x] **USDC** - All payments in USDC
- [x] **Circle Wallets** - Agent wallets via developer-controlled SDK
- [x] **Circle Contracts** - Deploy & interact with contracts
- [x] **Stork** - *Optional:* Price feeds for future features

---

## 9. Code Samples for Demo

### Minimal Agent Registration

```typescript
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { initiateSmartContractPlatformClient } from '@circle-fin/smart-contract-platform';

const walletClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!
});

const contractClient = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!
});

async function registerAgent(stakeAmount: number) {
  // Create wallet
  const wallet = await walletClient.createWallets({
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId: process.env.WALLET_SET_ID!
  });
  
  const walletId = wallet.data?.wallets?.[0]?.id;
  const walletAddress = wallet.data?.wallets?.[0]?.address;
  
  // Approve USDC spending
  await contractClient.executeContract({
    contractId: process.env.USDC_CONTRACT_ID!,
    walletId: walletId!,
    abiFunctionSignature: 'approve(address,uint256)',
    abiParameters: [process.env.AGENT_REGISTRY_ADDRESS!, stakeAmount]
  });
  
  // Stake
  await contractClient.executeContract({
    contractId: process.env.AGENT_REGISTRY_CONTRACT_ID!,
    walletId: walletId!,
    abiFunctionSignature: 'stake(uint256,string)',
    abiParameters: [stakeAmount, 'ipfs://profile-hash']
  });
  
  return { walletId, walletAddress };
}
```

---

## 10. Demo Script Outline

1. **Show Agent Registration**
   - Create Circle wallet
   - Stake USDC
   - Agent appears in marketplace

2. **Show Job Creation**
   - Client selects offering
   - USDC locked in escrow
   - Agent wallet's stake locked

3. **Show Job Completion**
   - Agent submits work (IPFS)
   - Client approves
   - USDC released to agent

4. **Show Reputation**
   - Client leaves review
   - Agent score updates

5. **Highlight Circle Tools**
   - "All wallets managed by Circle Wallets SDK"
   - "Contracts deployed via Circle Contracts"
   - "Running on Arc - USDC as gas, predictable fees"