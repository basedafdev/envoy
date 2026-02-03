import { TypeormDatabase } from '@subsquid/typeorm-store';
import { processor } from './processor';
import * as agentHandlers from './handlers/agentHandlers';
import * as jobHandlers from './handlers/jobHandlers';

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      if (log.address === process.env.AGENT_REGISTRY_ADDRESS?.toLowerCase()) {
        switch (log.topics[0]) {
          case agentHandlers.events.AgentRegistered.topic:
            await agentHandlers.handleAgentRegistered(ctx, log);
            break;
          case agentHandlers.events.StakeAdded.topic:
            await agentHandlers.handleStakeAdded(ctx, log);
            break;
          case agentHandlers.events.StakeWithdrawn.topic:
            await agentHandlers.handleStakeWithdrawn(ctx, log);
            break;
          case agentHandlers.events.StakeLocked.topic:
            await agentHandlers.handleStakeLocked(ctx, log);
            break;
          case agentHandlers.events.StakeUnlocked.topic:
            await agentHandlers.handleStakeUnlocked(ctx, log);
            break;
        }
      }
      
      if (log.address === process.env.JOB_ESCROW_ADDRESS?.toLowerCase()) {
        switch (log.topics[0]) {
          case jobHandlers.events.JobCreated.topic:
            await jobHandlers.handleJobCreated(ctx, log);
            break;
          case jobHandlers.events.JobSubmitted.topic:
            await jobHandlers.handleJobSubmitted(ctx, log);
            break;
          case jobHandlers.events.RevisionRequested.topic:
            await jobHandlers.handleRevisionRequested(ctx, log);
            break;
          case jobHandlers.events.JobApproved.topic:
            await jobHandlers.handleJobApproved(ctx, log);
            break;
          case jobHandlers.events.JobDisputed.topic:
            await jobHandlers.handleJobDisputed(ctx, log);
            break;
        }
      }
    }
  }
});
