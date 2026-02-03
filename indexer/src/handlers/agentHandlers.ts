import { Context, Log } from '../processor';
import { Agent, StakeEvent, StakeEventType } from '../model';
import * as agentRegistryAbi from '../abi/AgentRegistry';

export const events = agentRegistryAbi.events;

export async function handleAgentRegistered(ctx: Context, log: Log) {
  const event = events.AgentRegistered.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const agent = new Agent({
    id: event.agent.toLowerCase(),
    ensName: event.ensName,
    totalStaked: event.stake,
    lockedStake: 0n,
    isActive: true,
    registeredAt: new Date(blockTimestamp),
    registrationTx: log.transactionHash,
  });
  
  await ctx.store.upsert(agent);
  
  const stakeEvent = new StakeEvent({
    id: `${log.transactionHash}-${log.logIndex}`,
    agent,
    eventType: StakeEventType.REGISTERED,
    amount: event.stake,
    newTotal: event.stake,
    blockNumber: log.block.height,
    transactionHash: log.transactionHash,
    timestamp: new Date(blockTimestamp),
  });
  
  await ctx.store.insert(stakeEvent);
  
  ctx.log.info(`Indexed AgentRegistered: ${event.ensName} (${event.agent})`);
}

export async function handleStakeAdded(ctx: Context, log: Log) {
  const event = events.StakeAdded.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const agent = await ctx.store.get(Agent, event.agent.toLowerCase());
  if (!agent) {
    ctx.log.error(`Agent ${event.agent} not found for StakeAdded event`);
    return;
  }
  
  agent.totalStaked = event.newTotal;
  await ctx.store.save(agent);
  
  const stakeEvent = new StakeEvent({
    id: `${log.transactionHash}-${log.logIndex}`,
    agent,
    eventType: StakeEventType.ADDED,
    amount: event.amount,
    newTotal: event.newTotal,
    blockNumber: log.block.height,
    transactionHash: log.transactionHash,
    timestamp: new Date(blockTimestamp),
  });
  
  await ctx.store.insert(stakeEvent);
  
  ctx.log.info(`Indexed StakeAdded: ${event.agent} (+${event.amount})`);
}

export async function handleStakeWithdrawn(ctx: Context, log: Log) {
  const event = events.StakeWithdrawn.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const agent = await ctx.store.get(Agent, event.agent.toLowerCase());
  if (!agent) {
    ctx.log.error(`Agent ${event.agent} not found for StakeWithdrawn event`);
    return;
  }
  
  agent.totalStaked = event.newTotal;
  await ctx.store.save(agent);
  
  const stakeEvent = new StakeEvent({
    id: `${log.transactionHash}-${log.logIndex}`,
    agent,
    eventType: StakeEventType.WITHDRAWN,
    amount: event.amount,
    newTotal: event.newTotal,
    blockNumber: log.block.height,
    transactionHash: log.transactionHash,
    timestamp: new Date(blockTimestamp),
  });
  
  await ctx.store.insert(stakeEvent);
  
  ctx.log.info(`Indexed StakeWithdrawn: ${event.agent} (-${event.amount})`);
}

export async function handleStakeLocked(ctx: Context, log: Log) {
  const event = events.StakeLocked.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const agent = await ctx.store.get(Agent, event.agent.toLowerCase());
  if (!agent) {
    ctx.log.error(`Agent ${event.agent} not found for StakeLocked event`);
    return;
  }
  
  agent.lockedStake += event.amount;
  await ctx.store.save(agent);
  
  const stakeEvent = new StakeEvent({
    id: `${log.transactionHash}-${log.logIndex}`,
    agent,
    eventType: StakeEventType.LOCKED,
    amount: event.amount,
    newTotal: agent.totalStaked,
    jobId: event.jobId.toString(),
    blockNumber: log.block.height,
    transactionHash: log.transactionHash,
    timestamp: new Date(blockTimestamp),
  });
  
  await ctx.store.insert(stakeEvent);
  
  ctx.log.info(`Indexed StakeLocked: ${event.agent} (Job #${event.jobId})`);
}

export async function handleStakeUnlocked(ctx: Context, log: Log) {
  const event = events.StakeUnlocked.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const agent = await ctx.store.get(Agent, event.agent.toLowerCase());
  if (!agent) {
    ctx.log.error(`Agent ${event.agent} not found for StakeUnlocked event`);
    return;
  }
  
  agent.lockedStake -= event.amount;
  await ctx.store.save(agent);
  
  const stakeEvent = new StakeEvent({
    id: `${log.transactionHash}-${log.logIndex}`,
    agent,
    eventType: StakeEventType.UNLOCKED,
    amount: event.amount,
    newTotal: agent.totalStaked,
    jobId: event.jobId.toString(),
    blockNumber: log.block.height,
    transactionHash: log.transactionHash,
    timestamp: new Date(blockTimestamp),
  });
  
  await ctx.store.insert(stakeEvent);
  
  ctx.log.info(`Indexed StakeUnlocked: ${event.agent} (Job #${event.jobId})`);
}
