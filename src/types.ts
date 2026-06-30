export type IssueCategory = 'pothole' | 'garbage' | 'water_leak' | 'broken_streetlight' | 'graffiti' | 'tree_hazard' | 'general';

export type IssueStatus = 'reported' | 'verified' | 'in_progress' | 'resolved';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: string;
  reputationScore: number;
  badge?: string;
}

export interface Verification {
  id: string;
  issueId: string;
  verifierName: string;
  verifierId: string;
  type: 'confirm' | 'reject';
  evidence?: string;
  evidenceUrl?: string;
  distanceMeters: number;
  reputationAtVerification: number;
  createdAt: string;
}

export interface HistoryEntry {
  status: IssueStatus;
  timestamp: string;
  note: string;
  updatedBy: string;
}

export interface AIAnalysis {
  categorySuggested: string;
  descriptionRefined: string;
  severityPrediction: SeverityLevel;
  urgencyScore: number; // 0 to 100
  resolutionEstimate: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: SeverityLevel;
  lat: number;
  lng: number;
  locationName: string;
  imageUrl?: string;
  reportedBy: string;
  reporterId: string;
  reportedAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down';
  comments: Comment[];
  aiAnalysis?: AIAnalysis;
  history: HistoryEntry[];
  verifications: Verification[];
  trustScore: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  color: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  reputation: number;
  reportsCount: number;
  verifiedCount: number;
  avatar: string;
  rank: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
