// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgentRegistry is ReentrancyGuard {
    struct AgentInfo {
        string ensName;
        uint256 totalStaked;
        uint256 lockedStake;
        bool isActive;
        uint256 registeredAt;
    }

    IERC20 public immutable usdc;
    address public jobEscrow;
    
    mapping(address => AgentInfo) public agents;
    
    uint256 public constant MIN_STAKE = 50 * 10**6;

    event AgentRegistered(address indexed agent, uint256 stake, string ensName);
    event StakeAdded(address indexed agent, uint256 amount, uint256 newTotal);
    event StakeWithdrawn(address indexed agent, uint256 amount, uint256 newTotal);
    event StakeLocked(address indexed agent, uint256 amount, uint256 jobId);
    event StakeUnlocked(address indexed agent, uint256 amount, uint256 jobId);

    modifier onlyJobEscrow() {
        require(msg.sender == jobEscrow, "Only JobEscrow");
        _;
    }

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function setJobEscrow(address _jobEscrow) external {
        require(jobEscrow == address(0), "Already set");
        jobEscrow = _jobEscrow;
    }

    function stake(uint256 amount, string calldata agentName) external nonReentrant {
        require(amount >= MIN_STAKE, "Minimum stake: $50 USDC");
        require(!agents[msg.sender].isActive, "Already registered");

        usdc.transferFrom(msg.sender, address(this), amount);

        string memory ensName = string.concat(agentName, "bot.envoy.eth");
        
        agents[msg.sender] = AgentInfo({
            ensName: ensName,
            totalStaked: amount,
            lockedStake: 0,
            isActive: true,
            registeredAt: block.timestamp
        });

        emit AgentRegistered(msg.sender, amount, ensName);
    }

    function addStake(uint256 amount) external nonReentrant {
        require(agents[msg.sender].isActive, "Not registered");
        
        usdc.transferFrom(msg.sender, address(this), amount);
        agents[msg.sender].totalStaked += amount;
        
        emit StakeAdded(msg.sender, amount, agents[msg.sender].totalStaked);
    }

    function withdraw(uint256 amount) external nonReentrant {
        AgentInfo storage agent = agents[msg.sender];
        uint256 available = agent.totalStaked - agent.lockedStake;
        
        require(amount <= available, "Insufficient unlocked stake");
        
        agent.totalStaked -= amount;
        usdc.transfer(msg.sender, amount);
        
        emit StakeWithdrawn(msg.sender, amount, agent.totalStaked);
    }

    function lockStake(address agentAddress, uint256 amount, uint256 jobId) external onlyJobEscrow {
        AgentInfo storage agent = agents[agentAddress];
        uint256 available = agent.totalStaked - agent.lockedStake;
        
        require(amount <= available, "Insufficient available stake");
        
        agent.lockedStake += amount;
        
        emit StakeLocked(agentAddress, amount, jobId);
    }

    function unlockStake(address agentAddress, uint256 amount, uint256 jobId) external onlyJobEscrow {
        AgentInfo storage agent = agents[agentAddress];
        
        require(agent.lockedStake >= amount, "Invalid unlock amount");
        
        agent.lockedStake -= amount;
        
        emit StakeUnlocked(agentAddress, amount, jobId);
    }

    function getAvailableCapacity(address agentAddress) external view returns (uint256) {
        AgentInfo memory agent = agents[agentAddress];
        uint256 availableStake = agent.totalStaked - agent.lockedStake;
        return (availableStake * 80) / 100;
    }
}
