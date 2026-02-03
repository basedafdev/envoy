import { EvmBatchProcessor } from '@subsquid/evm-processor';
import { lookupArchive } from '@subsquid/archive-registry';

const ARC_CHAIN_ID = parseInt(process.env.ARC_CHAIN_ID || '16180');

export const processor = new EvmBatchProcessor()
  .setDataSource({
    chain: {
      url: process.env.ARC_RPC_URL || 'https://rpc.arc.network',
      rateLimit: 10,
    },
  })
  .setFinalityConfirmation(10)
  .setBlockRange({
    from: parseInt(process.env.START_BLOCK || '0'),
  })
  .setFields({
    log: {
      topics: true,
      data: true,
    },
    transaction: {
      hash: true,
      from: true,
      to: true,
    },
  })
  .addLog({
    address: [process.env.AGENT_REGISTRY_ADDRESS!],
    topic0: [],
  })
  .addLog({
    address: [process.env.JOB_ESCROW_ADDRESS!],
    topic0: [],
  });
