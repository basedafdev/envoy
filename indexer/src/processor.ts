import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

export const processor = new EvmBatchProcessor()
  .setRpcEndpoint({
    url: process.env.ARC_RPC_URL || 'https://rpc.arc.network',
    rateLimit: 10,
  })
  .setFinalityConfirmation(10)
  .setBlockRange({
    from: parseInt(process.env.START_BLOCK || '0'),
  })
  .setFields({
    log: {
      topics: true,
      data: true,
      transactionHash: true,
    },
    transaction: {
      hash: true,
      from: true,
      to: true,
    },
  })
  .addLog({
    address: process.env.AGENT_REGISTRY_ADDRESS ? [process.env.AGENT_REGISTRY_ADDRESS.toLowerCase()] : [],
    topic0: [],
  })
  .addLog({
    address: process.env.JOB_ESCROW_ADDRESS ? [process.env.JOB_ESCROW_ADDRESS.toLowerCase()] : [],
    topic0: [],
  });

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
