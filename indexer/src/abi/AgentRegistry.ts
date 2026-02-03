import { keccak256, toHex, decodeAbiParameters, parseAbiParameters } from 'viem';

const eventSignatures = {
  AgentRegistered: keccak256(toHex('AgentRegistered(address,uint256,string)')),
  StakeAdded: keccak256(toHex('StakeAdded(address,uint256,uint256)')),
  StakeWithdrawn: keccak256(toHex('StakeWithdrawn(address,uint256,uint256)')),
  StakeLocked: keccak256(toHex('StakeLocked(address,uint256,uint256)')),
  StakeUnlocked: keccak256(toHex('StakeUnlocked(address,uint256,uint256)')),
};

export const events = {
  AgentRegistered: {
    topic: eventSignatures.AgentRegistered,
    decode(log: { topics: string[]; data: string }): { agent: string; stake: bigint; ensName: string } {
      const agent = ('0x' + log.topics[1].slice(26)) as `0x${string}`;
      const [stake, ensName] = decodeAbiParameters(
        parseAbiParameters('uint256 stake, string ensName'),
        log.data as `0x${string}`
      );
      return { agent, stake, ensName };
    },
  },
  StakeAdded: {
    topic: eventSignatures.StakeAdded,
    decode(log: { topics: string[]; data: string }): { agent: string; amount: bigint; newTotal: bigint } {
      const agent = ('0x' + log.topics[1].slice(26)) as `0x${string}`;
      const [amount, newTotal] = decodeAbiParameters(
        parseAbiParameters('uint256 amount, uint256 newTotal'),
        log.data as `0x${string}`
      );
      return { agent, amount, newTotal };
    },
  },
  StakeWithdrawn: {
    topic: eventSignatures.StakeWithdrawn,
    decode(log: { topics: string[]; data: string }): { agent: string; amount: bigint; newTotal: bigint } {
      const agent = ('0x' + log.topics[1].slice(26)) as `0x${string}`;
      const [amount, newTotal] = decodeAbiParameters(
        parseAbiParameters('uint256 amount, uint256 newTotal'),
        log.data as `0x${string}`
      );
      return { agent, amount, newTotal };
    },
  },
  StakeLocked: {
    topic: eventSignatures.StakeLocked,
    decode(log: { topics: string[]; data: string }): { agent: string; amount: bigint; jobId: bigint } {
      const agent = ('0x' + log.topics[1].slice(26)) as `0x${string}`;
      const [amount, jobId] = decodeAbiParameters(
        parseAbiParameters('uint256 amount, uint256 jobId'),
        log.data as `0x${string}`
      );
      return { agent, amount, jobId };
    },
  },
  StakeUnlocked: {
    topic: eventSignatures.StakeUnlocked,
    decode(log: { topics: string[]; data: string }): { agent: string; amount: bigint; jobId: bigint } {
      const agent = ('0x' + log.topics[1].slice(26)) as `0x${string}`;
      const [amount, jobId] = decodeAbiParameters(
        parseAbiParameters('uint256 amount, uint256 jobId'),
        log.data as `0x${string}`
      );
      return { agent, amount, jobId };
    },
  },
};
