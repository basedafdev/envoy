import {Entity, PrimaryColumn, Column, ManyToOne, OneToMany, Index, JoinColumn} from 'typeorm';

export enum JobStatus {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum StakeEventType {
  REGISTERED = 'REGISTERED',
  ADDED = 'ADDED',
  WITHDRAWN = 'WITHDRAWN',
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
}

@Entity()
export class Agent {
  constructor(props?: Partial<Agent>) {
    Object.assign(this, props);
  }

  @PrimaryColumn('text')
  id!: string;

  @Column('text', {nullable: true})
  ensName!: string | null;

  @Column('numeric', {transformer: {to: (v) => v?.toString(), from: (v) => v ? BigInt(v) : 0n}})
  totalStaked!: bigint;

  @Column('numeric', {transformer: {to: (v) => v?.toString(), from: (v) => v ? BigInt(v) : 0n}})
  lockedStake!: bigint;

  @Column('boolean')
  isActive!: boolean;

  @Column('timestamp with time zone')
  registeredAt!: Date;

  @Column('text')
  registrationTx!: string;

  @OneToMany(() => Job, job => job.agent)
  jobs!: Job[];

  @OneToMany(() => StakeEvent, event => event.agent)
  stakeHistory!: StakeEvent[];
}

@Entity()
export class Job {
  constructor(props?: Partial<Job>) {
    Object.assign(this, props);
  }

  @PrimaryColumn('text')
  id!: string;

  @Index()
  @Column('text')
  client!: string;

  @Index()
  @ManyToOne(() => Agent, agent => agent.jobs)
  @JoinColumn({name: 'agent_id'})
  agent!: Agent;

  @Column('int', {nullable: true})
  offeringId!: number | null;

  @Column('numeric', {transformer: {to: (v) => v?.toString(), from: (v) => v ? BigInt(v) : 0n}})
  price!: bigint;

  @Column('text', {nullable: true})
  requirementsUrl!: string | null;

  @Column('text', {nullable: true})
  deliverableUrl!: string | null;

  @Column('text')
  status!: JobStatus;

  @Column('timestamp with time zone')
  createdAt!: Date;

  @Column('timestamp with time zone', {nullable: true})
  submittedAt!: Date | null;

  @Column('timestamp with time zone', {nullable: true})
  approvedAt!: Date | null;

  @Column('text')
  creationTx!: string;

  @Column('text', {nullable: true})
  submissionTx!: string | null;

  @Column('text', {nullable: true})
  approvalTx!: string | null;

  @Column('int')
  blockNumber!: number;

  @OneToMany(() => Revision, revision => revision.job)
  revisions!: Revision[];
}

@Entity()
export class StakeEvent {
  constructor(props?: Partial<StakeEvent>) {
    Object.assign(this, props);
  }

  @PrimaryColumn('text')
  id!: string;

  @Index()
  @ManyToOne(() => Agent, agent => agent.stakeHistory)
  @JoinColumn({name: 'agent_id'})
  agent!: Agent;

  @Column('text')
  eventType!: StakeEventType;

  @Column('numeric', {transformer: {to: (v) => v?.toString(), from: (v) => v ? BigInt(v) : 0n}})
  amount!: bigint;

  @Column('numeric', {transformer: {to: (v) => v?.toString(), from: (v) => v ? BigInt(v) : 0n}})
  newTotal!: bigint;

  @Column('text', {nullable: true})
  jobId!: string | null;

  @Column('int')
  blockNumber!: number;

  @Column('text')
  transactionHash!: string;

  @Column('timestamp with time zone')
  timestamp!: Date;
}

@Entity()
export class Revision {
  constructor(props?: Partial<Revision>) {
    Object.assign(this, props);
  }

  @PrimaryColumn('text')
  id!: string;

  @Index()
  @ManyToOne(() => Job, job => job.revisions)
  @JoinColumn({name: 'job_id'})
  job!: Job;

  @Column('text')
  feedback!: string;

  @Column('timestamp with time zone')
  requestedAt!: Date;

  @Column('text')
  transactionHash!: string;

  @Column('int')
  blockNumber!: number;
}

@Entity()
export class IndexerCheckpoint {
  constructor(props?: Partial<IndexerCheckpoint>) {
    Object.assign(this, props);
  }

  @PrimaryColumn('text')
  id!: string;

  @Column('int')
  lastBlock!: number;

  @Column('timestamp with time zone')
  updatedAt!: Date;
}
