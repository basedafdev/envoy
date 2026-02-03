import { Context, Log } from '../processor';
import { Job, JobStatus, Agent, Revision } from '../model';
import * as jobEscrowAbi from '../abi/JobEscrow';

export const events = {
  JobCreated: jobEscrowAbi.events.JobCreated,
  JobSubmitted: jobEscrowAbi.events.JobSubmitted,
  RevisionRequested: jobEscrowAbi.events.RevisionRequested,
  JobApproved: jobEscrowAbi.events.JobApproved,
  JobDisputed: jobEscrowAbi.events.JobDisputed,
};

export async function handleJobCreated(ctx: Context, log: Log) {
  const event = jobEscrowAbi.events.JobCreated.decode(log);
  
  const agent = await ctx.store.get(Agent, event.agent.toLowerCase());
  if (!agent) {
    ctx.log.error(`❌ Agent ${event.agent} not found for JobCreated event`);
    return;
  }
  
  const job = new Job({
    id: event.jobId.toString(),
    client: event.client.toLowerCase(),
    agent,
    price: event.price,
    status: JobStatus.CREATED,
    createdAt: new Date(ctx.blocks[0].header.timestamp),
    creationTx: log.transactionHash,
    blockNumber: ctx.blocks[0].header.height,
  });
  
  await ctx.store.insert(job);
  
  ctx.log.info(`✅ Indexed JobCreated: Job #${event.jobId}`);
}

export async function handleJobSubmitted(ctx: Context, log: Log) {
  const event = jobEscrowAbi.events.JobSubmitted.decode(log);
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`❌ Job #${event.jobId} not found for JobSubmitted event`);
    return;
  }
  
  job.status = JobStatus.SUBMITTED;
  job.deliverableUrl = event.deliverableUrl;
  job.submittedAt = new Date(ctx.blocks[0].header.timestamp);
  job.submissionTx = log.transactionHash;
  
  await ctx.store.save(job);
  
  ctx.log.info(`✅ Indexed JobSubmitted: Job #${event.jobId}`);
}

export async function handleRevisionRequested(ctx: Context, log: Log) {
  const event = jobEscrowAbi.events.RevisionRequested.decode(log);
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`❌ Job #${event.jobId} not found for RevisionRequested event`);
    return;
  }
  
  const revision = new Revision({
    id: `${log.transactionHash}-${log.logIndex}`,
    job,
    feedback: event.feedback,
    requestedAt: new Date(ctx.blocks[0].header.timestamp),
    transactionHash: log.transactionHash,
    blockNumber: ctx.blocks[0].header.height,
  });
  
  await ctx.store.insert(revision);
  
  ctx.log.info(`✅ Indexed RevisionRequested: Job #${event.jobId}`);
}

export async function handleJobApproved(ctx: Context, log: Log) {
  const event = jobEscrowAbi.events.JobApproved.decode(log);
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`❌ Job #${event.jobId} not found for JobApproved event`);
    return;
  }
  
  job.status = JobStatus.APPROVED;
  job.approvedAt = new Date(ctx.blocks[0].header.timestamp);
  job.approvalTx = log.transactionHash;
  
  await ctx.store.save(job);
  
  ctx.log.info(`✅ Indexed JobApproved: Job #${event.jobId}`);
}

export async function handleJobDisputed(ctx: Context, log: Log) {
  const event = jobEscrowAbi.events.JobDisputed.decode(log);
  
  const job = await ctx.store.get(Job, event.jobId.toString());
  if (!job) {
    ctx.log.error(`❌ Job #${event.jobId} not found for JobDisputed event`);
    return;
  }
  
  job.status = JobStatus.DISPUTED;
  
  await ctx.store.save(job);
  
  ctx.log.info(`✅ Indexed JobDisputed: Job #${event.jobId} by ${event.initiator}`);
}
