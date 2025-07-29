export interface Broker {
  nodeId: number;
  host: string;
  port: number;
}

export interface Topic {
  name: string;
  partitions?: number;
  totalMessages?: number;
  remainingMessages?: number;
  totalConsumed?: number;
  partitionDetails?: Array<{
    partition: number;
    offset: string;
    high: string;
    low: string;
    messages: string;
    consumerOffsets?: Record<string, {
      currentOffset: string;
      lag: number;
    }>;
  }>;
  replicas?: number;
  consumerLag?: Record<string, number>;
  totalLag?: number;
  hasActiveConsumers?: boolean;
  error?: string;
}

export interface ConsumerGroup {
  groupId: string;
  protocol?: string;
  state?: string;
  coordinator?: {
    nodeId: number;
    host: string;
    port: number;
  };
  members?: Array<{
    memberId: string;
    clientId: string;
    clientHost: string;
    assignments: string[];
  }>;
  memberCount?: number;
  error?: string;
}

export interface KafkaConnector {
  name: string;
  type: string;
  state: string;
  workerId?: string;
  totalTasks?: number;
  runningTasks?: number;
  failedTasks?: number;
  tasks?: Array<{
    id: number;
    state: string;
    workerId: string;
    trace?: string;
  }>;
  config?: Record<string, any>;
  error?: string;
}


export interface KafkaStatus {
  cluster: {
    brokers: Broker[];
    controllerId: number;
    connectionString?: string;
    advertisedBrokers?: string;
  } | null;
  topics: Topic[];
  totalTopics?: number;
  consumerGroups: ConsumerGroup[];
  totalGroups?: number;
  lastUpdated: string | null;
  error: string | null;
}