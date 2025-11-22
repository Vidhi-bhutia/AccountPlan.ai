export interface PlanSection {
  id: string;
  title: string;
  content: string;
}

export interface AccountPlan {
  companyName: string;
  sections: PlanSection[];
  lastUpdated: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  groundingSources?: GroundingSource[];
}

export enum ChatStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  SEARCHING = 'SEARCHING',
  UPDATING_PLAN = 'UPDATING_PLAN',
  ERROR = 'ERROR'
}
