export type IssueCategory = 'Pothole' | 'Water Leakage' | 'Broken Streetlight' | 'Waste Management' | 'Infrastructure';
export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'reported' | 'validated' | 'in_progress' | 'resolved';

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string | number;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  imageUrl: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  status: IssueStatus;
  upvoteCount: number;
  upvotedBy: string[];
  resolvedImageUrl?: string;
  resolvedBy?: string;
  aiCautionTips?: string;
  createdAt: string | number;
  updatedAt: string | number;
  comments?: Comment[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  points: number;
  badges: string[];
  createdAt: string | number;
}

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  avatarUrl: string;
  points: number;
  badgesCount: number;
  rank?: number;
}
