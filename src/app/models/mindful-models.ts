export interface MoodEntry {
  id?: string;
  moodScore: number;
  notes: string;
  timestamp: number;
  userId: string;
}

export interface TriggerItem {
  id?: string;
  name: string;
  timestamp: number;
  userId: string;
}

export interface CravingsItem {
  id?: string;
  name: string;
  timestamp: number;
  userId: string;
}

export type AppView = 'log' | 'history' | 'triggers' | 'cravings';
