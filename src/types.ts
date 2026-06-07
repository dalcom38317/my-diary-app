export type MoodType = 'happy' | 'peaceful' | 'excited' | 'sad' | 'tired' | 'angry';

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: MoodType;
  tags: string[];
  images: string[]; // Base64 encoded compressed image strings
  createdAt: string;
  updatedAt: string;
}

export interface DiaryStats {
  totalEntries: number;
  moodCounts: Record<MoodType, number>;
  writingStreak: number;
  storageUsedBytes: number;
}
