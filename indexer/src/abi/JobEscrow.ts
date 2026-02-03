import { keccak256, toHex, decodeAbiParameters, parseAbiParameters } from 'viem';

const eventSignatures = {
  JobCreated: keccak256(toHex('JobCreated(uint256,address,address,uint256)')),
  JobSubmitted: keccak256(toHex('JobSubmitted(uint256,string)')),
  RevisionRequested: keccak256(toHex('RevisionRequested(uint256,string)')),
  JobApproved: keccak256(toHex('JobApproved(uint256)')),
  JobDisputed: keccak256(toHex('JobDisputed(uint256,address)')),
  PaymentReleased: keccak256(toHex('PaymentReleased(uint256,address,uint256)')),
};

export const events = {
  JobCreated: {
    topic: eventSignatures.JobCreated,
    decode(log: { topics: string[]; data: string }): { jobId: bigint; client: string; agent: string; price: bigint } {
      const jobId = BigInt(log.topics[1]);
      const client = ('0x' + log.topics[2].slice(26)) as `0x${string}`;
      const agent = ('0x' + log.topics[3].slice(26)) as `0x${string}`;
      const [price] = decodeAbiParameters(
        parseAbiParameters('uint256 price'),
        log.data as `0x${string}`
      );
      return { jobId, client, agent, price };
    },
  },
  JobSubmitted: {
    topic: eventSignatures.JobSubmitted,
    decode(log: { topics: string[]; data: string }): { jobId: bigint; deliverableUrl: string } {
      const jobId = BigInt(log.topics[1]);
      const [deliverableUrl] = decodeAbiParameters(
        parseAbiParameters('string deliverableUrl'),
        log.data as `0x${string}`
      );
      return { jobId, deliverableUrl };
    },
  },
  RevisionRequested: {
    topic: eventSignatures.RevisionRequested,
    decode(log: { topics: string[]; data: string }): { jobId: bigint; feedback: string } {
      const jobId = BigInt(log.topics[1]);
      const [feedback] = decodeAbiParameters(
        parseAbiParameters('string feedback'),
        log.data as `0x${string}`
      );
      return { jobId, feedback };
    },
  },
  JobApproved: {
    topic: eventSignatures.JobApproved,
    decode(log: { topics: string[]; data: string }): { jobId: bigint } {
      const jobId = BigInt(log.topics[1]);
      return { jobId };
    },
  },
  JobDisputed: {
    topic: eventSignatures.JobDisputed,
    decode(log: { topics: string[]; data: string }): { jobId: bigint; initiator: string } {
      const jobId = BigInt(log.topics[1]);
      const [initiator] = decodeAbiParameters(
        parseAbiParameters('address initiator'),
        log.data as `0x${string}`
      );
      return { jobId, initiator };
    },
  },
  PaymentReleased: {
    topic: eventSignatures.PaymentReleased,
    decode(log: { topics: string[]; data: string }): { jobId: bigint; recipient: string; amount: bigint } {
      const jobId = BigInt(log.topics[1]);
      const [recipient, amount] = decodeAbiParameters(
        parseAbiParameters('address recipient, uint256 amount'),
        log.data as `0x${string}`
      );
      return { jobId, recipient, amount };
    },
  },
};
