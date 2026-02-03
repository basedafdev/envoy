// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentRegistry {
    function lockStake(address agent, uint256 amount, uint256 jobId) external;
    function unlockStake(address agent, uint256 amount, uint256 jobId) external;
    function getAvailableCapacity(address agent) external view returns (uint256);
}

contract JobEscrow is ReentrancyGuard {
    enum JobStatus {
        Created,
        Submitted,
        RevisionRequested,
        Approved,
        Disputed,
        Cancelled
    }

    struct Job {
        uint256 id;
        address client;
        address agent;
        uint256 price;
        string requirementsUrl;
        string deliverableUrl;
        JobStatus status;
        uint8 revisionsUsed;
        uint8 maxRevisions;
        uint256 createdAt;
        uint256 submittedAt;
    }

    IERC20 public immutable usdc;
    IAgentRegistry public immutable agentRegistry;
    
    mapping(uint256 => Job) public jobs;
    uint256 public jobCounter;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed agent, uint256 price);
    event JobSubmitted(uint256 indexed jobId, string deliverableUrl);
    event RevisionRequested(uint256 indexed jobId, string feedback);
    event JobApproved(uint256 indexed jobId);
    event JobDisputed(uint256 indexed jobId, address initiator);
    event PaymentReleased(uint256 indexed jobId, address recipient, uint256 amount);

    constructor(address _usdc, address _agentRegistry) {
        usdc = IERC20(_usdc);
        agentRegistry = IAgentRegistry(_agentRegistry);
    }

    function createJob(
        address agent,
        string calldata requirementsUrl,
        uint256 price,
        uint8 maxRevisions
    ) external nonReentrant returns (uint256 jobId) {
        uint256 capacity = agentRegistry.getAvailableCapacity(agent);
        require(price <= capacity, "Exceeds agent capacity");

        usdc.transferFrom(msg.sender, address(this), price);
        agentRegistry.lockStake(agent, price, jobCounter);

        jobId = jobCounter++;
        jobs[jobId] = Job({
            id: jobId,
            client: msg.sender,
            agent: agent,
            price: price,
            requirementsUrl: requirementsUrl,
            deliverableUrl: "",
            status: JobStatus.Created,
            revisionsUsed: 0,
            maxRevisions: maxRevisions,
            createdAt: block.timestamp,
            submittedAt: 0
        });

        emit JobCreated(jobId, msg.sender, agent, price);
    }

    function submit(uint256 jobId, string calldata deliverableUrl) external {
        Job storage job = jobs[jobId];
        
        require(msg.sender == job.agent, "Only agent");
        require(
            job.status == JobStatus.Created || job.status == JobStatus.RevisionRequested,
            "Invalid status"
        );

        job.deliverableUrl = deliverableUrl;
        job.status = JobStatus.Submitted;
        job.submittedAt = block.timestamp;

        emit JobSubmitted(jobId, deliverableUrl);
    }

    function approve(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Submitted, "Not submitted");

        job.status = JobStatus.Approved;
        usdc.transfer(job.agent, job.price);
        agentRegistry.unlockStake(job.agent, job.price, jobId);

        emit JobApproved(jobId);
        emit PaymentReleased(jobId, job.agent, job.price);
    }

    function requestRevision(uint256 jobId, string calldata feedback) external {
        Job storage job = jobs[jobId];
        
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Submitted, "Not submitted");
        require(job.revisionsUsed < job.maxRevisions, "No revisions left");

        job.status = JobStatus.RevisionRequested;
        job.revisionsUsed++;

        emit RevisionRequested(jobId, feedback);
    }

    function dispute(uint256 jobId) external {
        Job storage job = jobs[jobId];
        
        require(msg.sender == job.client || msg.sender == job.agent, "Not participant");
        require(
            job.status == JobStatus.Submitted || job.status == JobStatus.RevisionRequested,
            "Invalid status"
        );

        job.status = JobStatus.Disputed;

        emit JobDisputed(jobId, msg.sender);
    }

    function autoApprove(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        
        require(job.status == JobStatus.Submitted, "Not submitted");
        require(block.timestamp >= job.submittedAt + 7 days, "Too early");

        job.status = JobStatus.Approved;
        usdc.transfer(job.agent, job.price);
        agentRegistry.unlockStake(job.agent, job.price, jobId);

        emit JobApproved(jobId);
        emit PaymentReleased(jobId, job.agent, job.price);
    }
}
