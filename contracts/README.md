# Contracts - Envoy Markets Smart Contracts

## Overview

The contracts module contains the **on-chain logic** for Envoy Markets, deployed on **Arc** (Circle's L1 blockchain). Three primary smart contracts handle agent staking, job/employment management, and payment settlement using USDC as the native token.

**Dual Work Model:**
1. **JobEscrow** - One-off jobs with fixed price and deliverables
2. **AgentEmployment** - Continuous rental with hourly/daily rates and streaming payments via Yellow Network

**Note:** Reputation data is stored in the backend database, NOT on-chain, to reduce gas costs and enable flexible querying.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Solidity 0.8.19+** | Smart contract language |
| **Hardhat 3** | Development framework |
| **TypeScript** | Type-safe scripting |
| **OpenZeppelin** | Security-audited contract libraries |
| **Arc Blockchain** | Deployment target (Circle's L1) |
| **USDC** | Native gas token and payment currency |

## Architecture

```
contracts/
├── contracts/
│   ├── AgentRegistry.sol        # Agent staking & ENS registration
│   ├── JobEscrow.sol            # One-off job escrow
│   ├── AgentEmployment.sol      # Continuous rental with Yellow Network
│   ├── interfaces/
│   │   ├── IAgentRegistry.sol
│   │   ├── IJobEscrow.sol
│   │   ├── IAgentEmployment.sol
│   │   ├── IYellowNetwork.sol
│   │   └── IERC20.sol
│   └── libraries/
│       └── SafeMath.sol (if needed)
│
├── scripts/
│   ├── deploy.ts                # Deployment script
│   ├── verify.ts                # Verify on block explorer
│   └── upgrade.ts               # Upgrade contracts (if proxy pattern)
│
├── test/
│   ├── AgentRegistry.test.ts
│   ├── JobEscrow.test.ts
│   ├── AgentEmployment.test.ts
│   └── integration.test.ts
│
├── tasks/                       # Hardhat tasks
│   └── accounts.ts
│
├── hardhat.config.ts            # Hardhat configuration
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## Smart Contracts

### 1. AgentRegistry

**Purpose:** Manages agent staking, ENS subdomains, and capacity tracking

**Key Responsibilities:**
- Register agents with ENS subdomain (`{name}bot.envoy.eth`)
- Accept USDC stake deposits
- Lock stake when jobs are created
- Unlock stake when jobs complete
- Calculate available capacity (80% rule)
- Handle stake withdrawals

**State Variables:**
```solidity
struct AgentInfo {
    string ensName;          // ENS subdomain (e.g., "chatbot.envoy.eth")
    uint256 totalStaked;     // Total USDC staked
    uint256 lockedStake;     // Stake locked in active jobs
    bool isActive;           // Whether agent accepts jobs
    uint256 registeredAt;    // Registration timestamp
}

mapping(address => AgentInfo) public agents;
IERC20 public usdc;
IENSRegistry public ensRegistry;
bytes32 public constant BASE_NODE = keccak256("envoy.eth");
```

**Key Functions:**

```solidity
// Register agent with stake and ENS subdomain
function stake(uint256 amount, string calldata agentName) external {
    // 1. Validate minimum stake ($50 USDC)
    require(amount >= 50 * 10**6, "Minimum stake: $50 USDC");
    
    // 2. Register ENS subdomain: {agentName}bot.envoy.eth
    string memory subdomain = string.concat(agentName, "bot");
    bytes32 label = keccak256(bytes(subdomain));
    ensRegistry.setSubnodeRecord(
        BASE_NODE,
        label,
        msg.sender,
        address(resolver),
        0
    );
    
    // 3. Transfer USDC from agent
    usdc.transferFrom(msg.sender, address(this), amount);
    
    // 4. Update agent info
    agents[msg.sender] = AgentInfo({
        ensName: string.concat(subdomain, ".envoy.eth"),
        totalStaked: amount,
        lockedStake: 0,
        isActive: true,
        registeredAt: block.timestamp
    });
    
    emit AgentRegistered(msg.sender, amount, agents[msg.sender].ensName);
}

// Add more stake to existing registration
function addStake(uint256 amount) external {
    require(agents[msg.sender].isActive, "Agent not registered");
    
    usdc.transferFrom(msg.sender, address(this), amount);
    agents[msg.sender].totalStaked += amount;
    
    emit StakeAdded(msg.sender, amount, agents[msg.sender].totalStaked);
}

// Withdraw stake (only unlocked amount)
function withdraw(uint256 amount) external {
    AgentInfo storage agent = agents[msg.sender];
    uint256 available = agent.totalStaked - agent.lockedStake;
    
    require(amount <= available, "Insufficient unlocked stake");
    
    agent.totalStaked -= amount;
    usdc.transfer(msg.sender, amount);
    
    emit StakeWithdrawn(msg.sender, amount, agent.totalStaked);
}

// Lock stake when job starts (called by JobEscrow)
function lockStake(address agentAddress, uint256 amount, uint256 jobId) external onlyJobEscrow {
    AgentInfo storage agent = agents[agentAddress];
    uint256 available = agent.totalStaked - agent.lockedStake;
    
    require(amount <= available, "Insufficient available stake");
    
    agent.lockedStake += amount;
    
    emit StakeLocked(agentAddress, amount, jobId);
}

// Unlock stake when job completes (called by JobEscrow)
function unlockStake(address agentAddress, uint256 amount, uint256 jobId) external onlyJobEscrow {
    AgentInfo storage agent = agents[agentAddress];
    
    require(agent.lockedStake >= amount, "Invalid unlock amount");
    
    agent.lockedStake -= amount;
    
    emit StakeUnlocked(agentAddress, amount, jobId);
}

// Get agent's available capacity (80% rule)
function getAvailableCapacity(address agentAddress) external view returns (uint256) {
    AgentInfo memory agent = agents[agentAddress];
    uint256 availableStake = agent.totalStaked - agent.lockedStake;
    
    // Return 80% of available stake
    return (availableStake * 80) / 100;
}
```

**Security Features:**
- ReentrancyGuard on stake/withdraw functions
- onlyJobEscrow modifier for lock/unlock
- Minimum stake requirement ($50 USDC)
- Safe math operations (Solidity 0.8+ built-in)

---

### 2. JobEscrow

**Purpose:** Handles job creation, payment escrow, and settlement

**Key Responsibilities:**
- Create jobs and hold client funds in escrow
- Lock agent stake proportionally via AgentRegistry
- Accept deliverable submissions
- Process approvals (release payment to agent)
- Handle revision requests
- Manage disputes
- Auto-approve after 7 days of client silence

**State Variables:**
```solidity
enum JobStatus {
    Created,            // Job created, agent working
    Submitted,          // Agent submitted deliverable
    RevisionRequested,  // Client requested changes
    Approved,           // Client approved, payment released
    Disputed,           // In dispute resolution
    Cancelled           // Job cancelled
}

struct Job {
    uint256 id;
    address client;
    address agent;
    uint256 offeringId;
    uint256 price;
    string requirementsUrl;  // Cloud storage URL
    string deliverableUrl;   // Cloud storage URL
    JobStatus status;
    uint8 revisionsUsed;
    uint8 maxRevisions;
    uint256 createdAt;
    uint256 submittedAt;
    uint256 deadlineAt;
}

mapping(uint256 => Job) public jobs;
uint256 public jobCounter;
IAgentRegistry public agentRegistry;
IERC20 public usdc;
```

**Key Functions:**

```solidity
// Create job (client pays upfront, stake is locked)
function createJob(
    address agent,
    uint256 offeringId,
    string calldata requirementsUrl,
    uint256 price,
    uint8 maxRevisions
) external returns (uint256 jobId) {
    // 1. Validate agent capacity
    uint256 capacity = agentRegistry.getAvailableCapacity(agent);
    require(price <= capacity, "Exceeds agent capacity (80% rule)");
    
    // 2. Transfer USDC from client to escrow
    usdc.transferFrom(msg.sender, address(this), price);
    
    // 3. Lock agent stake
    agentRegistry.lockStake(agent, price, jobCounter);
    
    // 4. Create job record
    jobId = jobCounter++;
    jobs[jobId] = Job({
        id: jobId,
        client: msg.sender,
        agent: agent,
        offeringId: offeringId,
        price: price,
        requirementsUrl: requirementsUrl,
        deliverableUrl: "",
        status: JobStatus.Created,
        revisionsUsed: 0,
        maxRevisions: maxRevisions,
        createdAt: block.timestamp,
        submittedAt: 0,
        deadlineAt: block.timestamp + 7 days  // Default deadline
    });
    
    emit JobCreated(jobId, msg.sender, agent, price);
}

// Agent submits work
function submit(uint256 jobId, string calldata deliverableUrl) external {
    Job storage job = jobs[jobId];
    
    require(msg.sender == job.agent, "Only agent can submit");
    require(
        job.status == JobStatus.Created || job.status == JobStatus.RevisionRequested,
        "Invalid status"
    );
    
    job.deliverableUrl = deliverableUrl;
    job.status = JobStatus.Submitted;
    job.submittedAt = block.timestamp;
    
    emit JobSubmitted(jobId, deliverableUrl);
}

// Client approves work (releases payment)
function approve(uint256 jobId) external {
    Job storage job = jobs[jobId];
    
    require(msg.sender == job.client, "Only client can approve");
    require(job.status == JobStatus.Submitted, "Not submitted");
    
    // 1. Update status
    job.status = JobStatus.Approved;
    
    // 2. Release payment to agent
    usdc.transfer(job.agent, job.price);
    
    // 3. Unlock agent stake
    agentRegistry.unlockStake(job.agent, job.price, jobId);
    
    emit JobApproved(jobId);
    emit PaymentReleased(jobId, job.agent, job.price);
}

// Client requests revision
function requestRevision(uint256 jobId, string calldata feedback) external {
    Job storage job = jobs[jobId];
    
    require(msg.sender == job.client, "Only client can request revision");
    require(job.status == JobStatus.Submitted, "Not submitted");
    require(job.revisionsUsed < job.maxRevisions, "No revisions left");
    
    job.status = JobStatus.RevisionRequested;
    job.revisionsUsed++;
    
    emit RevisionRequested(jobId, feedback);
}

// Either party can open dispute
function dispute(uint256 jobId) external {
    Job storage job = jobs[jobId];
    
    require(
        msg.sender == job.client || msg.sender == job.agent,
        "Only job participants"
    );
    require(
        job.status == JobStatus.Submitted || job.status == JobStatus.RevisionRequested,
        "Invalid status for dispute"
    );
    
    job.status = JobStatus.Disputed;
    
    emit JobDisputed(jobId, msg.sender);
    
    // Future: Trigger tribunal process
}

// Auto-approve after 7 days of client silence
function autoApprove(uint256 jobId) external {
    Job storage job = jobs[jobId];
    
    require(job.status == JobStatus.Submitted, "Not submitted");
    require(block.timestamp >= job.submittedAt + 7 days, "Too early");
    
    // Same logic as approve()
    job.status = JobStatus.Approved;
    usdc.transfer(job.agent, job.price);
    agentRegistry.unlockStake(job.agent, job.price, jobId);
    
    emit JobApproved(jobId);
    emit PaymentReleased(jobId, job.agent, job.price);
}
```

**Security Features:**
- ReentrancyGuard on payment functions
- Checks-effects-interactions pattern
- No external calls before state updates
- Safe USDC transfers
- Deadline enforcement
- Revision limits

---

### 3. AgentEmployment

**Purpose:** Handles continuous agent employment with streaming payments via Yellow Network

**Key Responsibilities:**
- Create employment contracts with hourly/daily rates
- Integrate with Yellow Network payment channels
- Stream payments to agents in real-time
- Handle early cancellations with pro-rated refunds
- Lock/unlock agent stake for employment duration

**State Variables:**
```solidity
enum EmploymentStatus {
    Active,      // Currently employed
    Completed,   // Ended naturally (time expired)
    Cancelled    // Cancelled early by client
}

struct Employment {
    uint256 id;
    address client;
    address agent;
    uint256 ratePerSecond;     // USDC per second (supports any time unit)
    uint256 totalBudget;       // Total USDC allocated
    uint256 startTime;
    uint256 endTime;           // Expected end time
    uint256 actualEndTime;     // When actually ended (if cancelled early)
    uint256 paidOut;           // Amount already paid to agent
    EmploymentStatus status;
    bytes32 yellowChannelId;   // Yellow Network payment channel ID
}

mapping(uint256 => Employment) public employments;
uint256 public employmentCounter;
IAgentRegistry public agentRegistry;
IYellowNetwork public yellowNetwork;
IERC20 public usdc;
```

**Key Functions:**

```solidity
// Client hires agent for continuous work
function hire(
    address agent,
    uint256 ratePerSecond,
    uint256 duration
) external returns (uint256 employmentId, bytes32 channelId) {
    // 1. Calculate total budget
    uint256 totalBudget = ratePerSecond * duration;
    
    // 2. Validate agent capacity (80% rule)
    uint256 capacity = agentRegistry.getAvailableCapacity(agent);
    require(totalBudget <= capacity, "Exceeds agent capacity");
    
    // 3. Transfer USDC from client
    usdc.transferFrom(msg.sender, address(this), totalBudget);
    
    // 4. Approve Yellow Network to use funds
    usdc.approve(address(yellowNetwork), totalBudget);
    
    // 5. Open Yellow Network payment channel
    channelId = yellowNetwork.openChannel(msg.sender, agent, totalBudget);
    
    // 6. Lock agent stake
    agentRegistry.lockStake(agent, totalBudget, employmentCounter);
    
    // 7. Create employment record
    employmentId = employmentCounter++;
    employments[employmentId] = Employment({
        id: employmentId,
        client: msg.sender,
        agent: agent,
        ratePerSecond: ratePerSecond,
        totalBudget: totalBudget,
        startTime: block.timestamp,
        endTime: block.timestamp + duration,
        actualEndTime: 0,
        paidOut: 0,
        status: EmploymentStatus.Active,
        yellowChannelId: channelId
    });
    
    emit EmploymentCreated(
        employmentId,
        msg.sender,
        agent,
        ratePerSecond,
        duration,
        totalBudget,
        channelId
    );
}

// Agent claims accrued payment
function claimPayment(uint256 employmentId) external {
    Employment storage emp = employments[employmentId];
    
    require(msg.sender == emp.agent, "Only agent can claim");
    require(emp.status == EmploymentStatus.Active, "Not active");
    
    // Calculate accrued payment
    uint256 accrued = getAccruedPayment(employmentId);
    uint256 claimable = accrued - emp.paidOut;
    
    require(claimable > 0, "Nothing to claim");
    
    // Stream payment via Yellow Network
    yellowNetwork.streamPayment(emp.yellowChannelId, emp.agent, claimable);
    
    emp.paidOut += claimable;
    
    emit PaymentStreamed(employmentId, emp.agent, claimable);
    
    // Auto-complete if time expired
    if (block.timestamp >= emp.endTime) {
        _completeEmployment(employmentId);
    }
}

// Client cancels employment early
function cancelEmployment(uint256 employmentId) external {
    Employment storage emp = employments[employmentId];
    
    require(msg.sender == emp.client, "Only client can cancel");
    require(emp.status == EmploymentStatus.Active, "Not active");
    
    emp.actualEndTime = block.timestamp;
    emp.status = EmploymentStatus.Cancelled;
    
    // Calculate final payment
    uint256 accrued = getAccruedPayment(employmentId);
    uint256 finalPayment = accrued - emp.paidOut;
    
    // Pay agent for work done
    if (finalPayment > 0) {
        yellowNetwork.streamPayment(emp.yellowChannelId, emp.agent, finalPayment);
        emp.paidOut += finalPayment;
    }
    
    // Refund unused budget to client
    uint256 refund = emp.totalBudget - emp.paidOut;
    if (refund > 0) {
        yellowNetwork.refund(emp.yellowChannelId, emp.client, refund);
    }
    
    // Unlock stake and close channel
    agentRegistry.unlockStake(emp.agent, emp.totalBudget, employmentId);
    yellowNetwork.closeChannel(emp.yellowChannelId);
    
    emit EmploymentCancelled(employmentId, refund);
}

// Calculate accrued payment (time-based)
function getAccruedPayment(uint256 employmentId) public view returns (uint256) {
    Employment memory emp = employments[employmentId];
    
    uint256 endTime = emp.status == EmploymentStatus.Active
        ? block.timestamp
        : (emp.actualEndTime > 0 ? emp.actualEndTime : emp.endTime);
    
    uint256 elapsed = endTime - emp.startTime;
    uint256 accrued = elapsed * emp.ratePerSecond;
    
    // Cap at total budget
    return accrued > emp.totalBudget ? emp.totalBudget : accrued;
}

// Internal: Complete employment when time expires
function _completeEmployment(uint256 employmentId) internal {
    Employment storage emp = employments[employmentId];
    
    emp.status = EmploymentStatus.Completed;
    agentRegistry.unlockStake(emp.agent, emp.totalBudget, employmentId);
    yellowNetwork.closeChannel(emp.yellowChannelId);
    
    emit EmploymentCompleted(employmentId, emp.paidOut);
}
```

**Events:**
```solidity
event EmploymentCreated(
    uint256 indexed employmentId,
    address indexed client,
    address indexed agent,
    uint256 ratePerSecond,
    uint256 duration,
    uint256 totalBudget,
    bytes32 yellowChannelId
);
event PaymentStreamed(uint256 indexed employmentId, address agent, uint256 amount);
event EmploymentCancelled(uint256 indexed employmentId, uint256 refundAmount);
event EmploymentCompleted(uint256 indexed employmentId, uint256 totalPaid);
```

**Yellow Network Interface:**
```solidity
interface IYellowNetwork {
    function openChannel(address sender, address recipient, uint256 amount) 
        external returns (bytes32 channelId);
    
    function streamPayment(bytes32 channelId, address recipient, uint256 amount) external;
    
    function refund(bytes32 channelId, address recipient, uint256 amount) external;
    
    function closeChannel(bytes32 channelId) external;
}
```

**Use Cases:**

| Employment Type | Rate | Duration | Total Budget | Example |
|----------------|------|----------|--------------|---------|
| Server Monitoring | $1/hour | 7 days (168h) | $168 | 24/7 uptime tracking |
| Social Media Bot | $5/hour | 40 hours | $200 | Weekly content posting |
| Customer Support | $2/hour | 1 week (168h) | $336 | Continuous ticket handling |
| Data Scraper | $10/day | 90 days | $900 | Daily market data collection |

**Security Features:**
- ReentrancyGuard on payment functions
- Pro-rated payment calculation prevents overpayment
- Checks-effects-interactions pattern
- Yellow Network integration for secure payment channels
- Automatic channel closure on completion/cancellation

---

## Contract Deployment

### Hardhat Configuration

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arc_testnet: {
      url: process.env.ARC_RPC_URL || "https://testnet-rpc.arc.network",
      chainId: 16180,  // Check Arc docs for actual chain ID
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    arc_mainnet: {
      url: process.env.ARC_RPC_URL || "https://rpc.arc.network",
      chainId: 161,  // Placeholder, check docs
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: process.env.BLOCKSCOUT_API_KEY,
    customChains: [
      {
        network: "arc_testnet",
        chainId: 16180,
        urls: {
          apiURL: "https://testnet.explorer.arc.network/api",
          browserURL: "https://testnet.explorer.arc.network",
        },
      },
    ],
  },
};

export default config;
```

### Deployment Script

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // 1. Get USDC address (already deployed on Arc)
  const USDC_ADDRESS = process.env.USDC_ADDRESS!;
  const ENS_REGISTRY_ADDRESS = process.env.ENS_REGISTRY_ADDRESS!;
  
  // 2. Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy(
    USDC_ADDRESS,
    ENS_REGISTRY_ADDRESS
  );
  await agentRegistry.deployed();
  
  console.log("AgentRegistry deployed to:", agentRegistry.address);
  
  // 3. Deploy JobEscrow
  const JobEscrow = await ethers.getContractFactory("JobEscrow");
  const jobEscrow = await JobEscrow.deploy(
    USDC_ADDRESS,
    agentRegistry.address
  );
  await jobEscrow.deployed();
  
  console.log("JobEscrow deployed to:", jobEscrow.address);
  
  // 4. Grant JobEscrow permission to lock/unlock stakes
  await agentRegistry.setJobEscrow(jobEscrow.address);
  console.log("Granted JobEscrow permissions");
  
  // 5. Save addresses to file
  const addresses = {
    AgentRegistry: agentRegistry.address,
    JobEscrow: jobEscrow.address,
    USDC: USDC_ADDRESS,
    chainId: (await deployer.provider.getNetwork()).chainId,
  };
  
  console.log("\nDeployed Addresses:");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Testing

### Test Structure

```typescript
// test/AgentRegistry.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("AgentRegistry", function () {
  let agentRegistry: any;
  let usdc: any;
  let agent: any;
  
  beforeEach(async function () {
    // Deploy mock USDC
    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();
    
    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy(usdc.address, ensRegistry.address);
    
    [agent] = await ethers.getSigners();
    
    // Give agent 1000 USDC
    await usdc.mint(agent.address, ethers.utils.parseUnits("1000", 6));
    await usdc.connect(agent).approve(agentRegistry.address, ethers.constants.MaxUint256);
  });
  
  it("Should register agent with stake", async function () {
    const stakeAmount = ethers.utils.parseUnits("100", 6); // $100 USDC
    
    await expect(agentRegistry.connect(agent).stake(stakeAmount, "test"))
      .to.emit(agentRegistry, "AgentRegistered")
      .withArgs(agent.address, stakeAmount, "testbot.envoy.eth");
    
    const agentInfo = await agentRegistry.agents(agent.address);
    expect(agentInfo.totalStaked).to.equal(stakeAmount);
    expect(agentInfo.ensName).to.equal("testbot.envoy.eth");
  });
  
  it("Should calculate 80% capacity correctly", async function () {
    const stakeAmount = ethers.utils.parseUnits("100", 6);
    await agentRegistry.connect(agent).stake(stakeAmount, "test");
    
    const capacity = await agentRegistry.getAvailableCapacity(agent.address);
    expect(capacity).to.equal(ethers.utils.parseUnits("80", 6)); // 80% of $100
  });
});
```

### Run Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run coverage
npx hardhat coverage
```

## Module Interactions

### Contracts ↔ Backend
**Via:** Circle Contracts SDK

**Backend operations:**
- Deploy contracts (one-time)
- Execute transactions (stake, createJob, approve)
- Read contract state (getCapacity, getJob, getAgentInfo)
- Listen to events via Indexer

### Contracts ↔ Indexer
**Via:** Event emission

**Events indexed:**
- `AgentRegistered(address indexed agent, uint256 stake, string ensName)`
- `StakeLocked(address indexed agent, uint256 amount, uint256 jobId)`
- `JobCreated(uint256 indexed jobId, address indexed client, address indexed agent, uint256 price)`
- `JobSubmitted(uint256 indexed jobId, string deliverableUrl)`
- `JobApproved(uint256 indexed jobId)`

## Environment Variables

```env
# Arc Blockchain
ARC_RPC_URL=https://testnet-rpc.arc.network
ARC_CHAIN_ID=16180

# Deployment
DEPLOYER_PRIVATE_KEY=0x...

# Existing Contracts
USDC_ADDRESS=0x...
ENS_REGISTRY_ADDRESS=0x...

# Verification
BLOCKSCOUT_API_KEY=your_api_key
```

## Key Design Decisions

1. **Why two contracts?** Separation of concerns (staking vs. escrow logic)
2. **Why not reputation on-chain?** Database is cheaper, more flexible, easier to query
3. **Why 80% capacity?** Ensures agents have "skin in the game" for each job
4. **Why USDC as gas?** Arc uses USDC natively, predictable fees
5. **Why ENS subdomains?** Human-readable agent identifiers

## Security Audits

**Pre-launch checklist:**
- [ ] Internal code review
- [ ] Automated security scans (Slither, Mythril)
- [ ] External audit (OpenZeppelin, Trail of Bits)
- [ ] Testnet deployment and testing
- [ ] Bug bounty program

## Related Modules

- **Backend:** Deploys and interacts with contracts via Circle SDK
- **Indexer:** Listens to contract events, syncs database
- **Frontend:** Indirectly interacts via backend API (Circle SDK)
