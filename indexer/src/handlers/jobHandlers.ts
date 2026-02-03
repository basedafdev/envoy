import { Context, Log } from '../processor';
import { Job, JobStatus, Agent, Revision } from '../model';
import * as jobEscrowAbi from '../abi/JobEscrow';

export const events = jobEscrowAbi.events;

export async function handleJobCreated(ctx: Context, log: Log) {
  const event = events.JobCreated.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const agent = await ctx.store.get(Agent, event.agent.toLowerCase());
  if (!agent) {
    ctx.log.error(`Agent ${event.agent} not found for JobCreated event`);
    return;
  }
  
  const job = new Job({
    id: event.jobId.toString(),
    client: event.client.toLowerCase(),
    agent,
    price: event.price,
    status: JobStatus.CREATED,
    createdAt: new Date(blockTimestamp),
    creationTx: log.transactionHash,
    blockNumber: log.block.height,
  });
  
  await ctx.store.insert(job);
  
  ctx.log.info(`Indexed JobCreated: Job #${event.jobId}`);
}

export async function handleJobSubmitted(ctx: Context, log: Log) {
  const event = events.JobSubmitted.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`Job #${event.jobId} not found for JobSubmitted event`);
    return;
  }
  
  job.status = JobStatus.SUBMITTED;
  job.deliverableUrl = event.deliverableUrl;
  job.submittedAt = new Date(blockTimestamp);
  job.submissionTx = log.transactionHash;
  
  await ctx.store.save(job);
  
  ctx.log.info(`Indexed JobSubmitted: Job #${event.jobId}`);
}

export async function handleRevisionRequested(ctx: Context, log: Log) {
  const event = events.RevisionRequested.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`Job #${event.jobId} not found for RevisionRequested event`);
    return;
  }
  
  const revision = new Revision({
    id: `${log.transactionHash}-${log.logIndex}`,
    job,
    feedback: event.feedback,
    requestedAt: new Date(blockTimestamp),
    transactionHash: log.transactionHash,
    blockNumber: log.block.height,
  });
  
  await ctx.store.insert(revision);
  
  ctx.log.info(`Indexed RevisionRequested: Job #${event.jobId}`);
}

export async function handleJobApproved(ctx: Context, log: Log) {
  const event = events.JobApproved.decode(log);
  const blockTimestamp = ctx.blocks.find(b => b.logs.includes(log))?.header.timestamp || Date.now();
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`Job #${event.jobId} not found for JobApproved event`);
    return;
  }
  
  job.status = JobStatus.APPROVED;
  job.approvedAt = new Date(blockTimestamp);
  job.approvalTx = log.transactionHash;
  
  await ctx.store.save(job);
  
  ctx.log.info(`Indexed JobApproved: Job #${event.jobId}`);
}

export async function handleJobDisputed(ctx: Context, log: Log) {
  const event = events.JobDisputed.decode(log);
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`Job #${event.jobId} not found for JobDisputed event`);
    return;
  }
  
  job.status = JobStatus.DISPUTED;
  
  await ctx.store.save(job);
  
  ctx.log.info(`Indexed JobDisputed: Job #${event.jobId} by ${event.initiator}`);
}
