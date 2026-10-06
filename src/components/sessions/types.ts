export interface SessionCounts {
  characters: number;
  sessionLogs: number;
}

export interface SessionItem {
  id: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: SessionCounts;
}
