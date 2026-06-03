export type LogType = 'mutation' | 'query' | 'deletion' | 'creation';
export type LogCategory = 'activity' | 'mutation';

export interface LogChanges {
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

export interface ActivityLog {
  _id: string;
  logType: LogType;
  userId: string;
  userRole: string;
  action: string;
  description: string;
  targetCollection?: string;
  targetId?: string;
  changes?: LogChanges | null;
  timestamp: string;
}
