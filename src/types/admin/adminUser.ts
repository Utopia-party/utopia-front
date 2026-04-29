export type AdminUserStatus = '정상' | '주의' | '정지';

export type AdminUserRecord = {
  id: string;
  name?: string | null;
  nickname: string;
  createdAt: string;
  status: AdminUserStatus;
  reportCount: number;
  partyCount: number;
  trustScore: number;
  lastActive: string;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  nickname: string;
  name?: string | null;
  phone?: string | null;
  role: string;
  status: string;
  trustScore: number;
  reportCount: number;
  partyCount: number;
  createdAt?: string | null;
  lastActive?: string | null;
  bannedUntil?: string | null;

  recentLoginIp?: string | null;
  recentLoginUserAgent?: string | null;
  recentLoginAt?: string | null;

  referrerId?: string | null;
  referrerNickname?: string | null;
  referrerCount?: number;

  trustHistories: AdminUserTrustHistory[];
  accessLogs: AdminUserAccessLog[];
  moderationHistories: AdminUserModerationHistory[];
};

export type AdminUserAccessLog = {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  isActive: boolean;
};

export type AdminUserTrustHistory = {
  id: string;
  title: string;
  detail?: string | null;
  scoreChange: number;
  trustScoreAfter: number;
  createdAt: string;
  changedBy: string;
};

export type AdminUserModerationHistory = {
  id: string;
  actionType: string;
  reason?: string | null;
  trustScoreChange?: number | null;
  durationMinutes?: number | null;
  createdAt: string;
  createdBy: string;
};

export type AdminUserStatusLog = {
  id: string;
  toStatus: string;
  changedBy: string;
  reason?: string | null;
  trigger: 'manual' | 'report' | 'auto';
  createdAt: string;
};

export type AdminUserListParams = {
  keyword?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
};

export type AdminUserStatusUpdatePayload = {
  status: AdminUserStatus;
  reason?: string;
};

export type AdminUserTrustScoreUpdatePayload = {
  trustScore: number;
  reason?: string;
};

export type AdminUserRecommenderUpdatePayload = {
  referrerNickname: string | null;
  reason?: string;
};
