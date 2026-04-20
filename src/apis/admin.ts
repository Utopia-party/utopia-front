import axios from 'axios';
import { api } from './api';

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  delta?: string | null;
  trend?: string | null;
};

export type DashboardSummaryRow = {
  label: string;
  value: string;
};

export type DashboardSeriesPoint = {
  label: string;
  current: number;
  comparison: number;
};

export type DashboardChart = {
  id: string;
  label: string;
  description: string;
  unit: string;
  points: DashboardSeriesPoint[];
};

export type DashboardRecentActivity = {
  timestamp: string;
  title: string;
  description: string;
};

type AdminDashboardApiResponse = {
  metrics: DashboardMetric[];
  member_stats: DashboardSummaryRow[];
  sales_stats: DashboardSummaryRow[];
  today_summary: string;
  period_label: string;
  comparison_label: string;
  compare_mode: string;
  range_start: string;
  range_end: string;
  chart_points: DashboardSeriesPoint[];
  chart_groups: DashboardChart[];
  recent_activities: DashboardRecentActivity[];
};

export type AdminDashboard = {
  metrics: DashboardMetric[];
  memberStats: DashboardSummaryRow[];
  salesStats: DashboardSummaryRow[];
  todaySummary: string;
  periodLabel: string;
  comparisonLabel: string;
  compareMode: string;
  rangeStart: string;
  rangeEnd: string;
  chartPoints: DashboardSeriesPoint[];
  chartGroups: DashboardChart[];
  recentActivities: DashboardRecentActivity[];
};

export type AdminRoleRecord = {
  id: string;
  userId: string;
  adminId: string;
  canManageUsers: boolean;
  canManageParties: boolean;
  canManageReports: boolean;
  canManageModeration: boolean;
  canApproveReceipts: boolean;
  canApproveSettlements: boolean;
  canViewLogs: boolean;
  canManageAdmins: boolean;
  lastUpdated: string;
  updatedBy: string;
};

export type AdminRoleUpdatePayload = Omit<
  AdminRoleRecord,
  'id' | 'userId' | 'adminId' | 'lastUpdated' | 'updatedBy'
>;

export type AdminPermissions = AdminRoleUpdatePayload;

export type AdminServiceRecord = {
  id: string;
  name: string;
  category: string;
  maxMembers: number;
  monthlyPrice: number;
  originalPrice: number;
  logoImageKey?: string | null;
  logoImageUrl?: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  commissionRate: number;
  leaderDiscountRate: number;
  referralDiscountRate: number;
};

export type AdminServiceUpdatePayload = {
  maxMembers: number;
  monthlyPrice: number;
  originalPrice: number;
  logoImageKey?: string | null;
  isActive: boolean;
  commissionRate: number;
  leaderDiscountRate: number;
  referralDiscountRate: number;
};

export type AdminUserRecord = {
  id: string;
  name?: string | null;
  nickname: string;
  status: '정상' | '주의' | '정지';
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
};

export type AdminPartyRecord = {
  id: string;
  title: string;
  service: string;
  category: string;
  leaderId: string;
  memberCount: number;
  // 파티 종료 수정
  status: '운영중' | '모집중' | '위험' | '종료됨';
  // 파티 종료 수정
  reportCount: number;
  monthlyAmount: number;
  lastPayment: string;
};

export type ReportRecord = {
  id: string;
  type: string;
  target: string;
  reason: string;
  status: string;
  content: string;
  createdAt: string;
};

export type ReceiptRecord = {
  id: string;
  userId: string;
  partyId: string;
  ocrAmount: number;
  status: string;
  createdAt: string;
};

export type SettlementRecord = {
  id: string;
  partyId: string;
  partyName: string;
  leaderId: string;
  leaderName: string;
  totalAmount: number;
  memberCount: number;
  billingMonth: string;
  status: string;
  createdAt: string;
};

export type SystemLogRecord = {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  actor: string;
};

export async function fetchAdminDashboard(params?: {
  date_from?: string;
  date_to?: string;
  compare_mode?: 'previous_period' | 'year_over_year';
}): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboardApiResponse>(
    '/api/admin/dashboard',
    { params },
  );
  return {
    metrics: data.metrics,
    memberStats: data.member_stats,
    salesStats: data.sales_stats,
    todaySummary: data.today_summary,
    periodLabel: data.period_label,
    comparisonLabel: data.comparison_label,
    compareMode: data.compare_mode,
    rangeStart: data.range_start,
    rangeEnd: data.range_end,
    chartPoints: data.chart_points,
    chartGroups: data.chart_groups,
    recentActivities: data.recent_activities,
  };
}

export async function fetchAdminRoles(): Promise<AdminRoleRecord[]> {
  const { data } = await api.get<AdminRoleRecord[]>('/api/admin/roles');
  return data;
}

export async function fetchAdminPermissions(): Promise<AdminPermissions> {
  const { data } = await api.get<AdminPermissions>('/api/admin/me');
  return data;
}

export async function updateAdminRole(
  userId: string,
  payload: AdminRoleUpdatePayload,
) {
  const { data } = await api.put<AdminRoleRecord>(
    `/api/admin/roles/${userId}`,
    payload,
  );
  return data;
}

export async function fetchAdminUsers(params?: {
  keyword?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AdminUserRecord[]> {
  const { data } = await api.get<AdminUserRecord[]>('/api/admin/users', {
    params,
  });
  return data;
}

export async function fetchAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail> {
  const { data } = await api.get<AdminUserDetail>(`/api/admin/users/${userId}`);
  return data;
}

export async function updateAdminUserStatus(
  userId: string,
  payload: { status: string; reason?: string },
) {
  const { data } = await api.patch<AdminUserRecord>(
    `/api/admin/users/${userId}/status`,
    payload,
  );
  return data;
}

export async function fetchAdminParties(params?: {
  keyword?: string;
  status?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AdminPartyRecord[]> {
  const { data } = await api.get<AdminPartyRecord[]>('/api/admin/parties', {
    params,
  });
  return data;
}

export async function fetchAdminServices(): Promise<AdminServiceRecord[]> {
  const { data } = await api.get<AdminServiceRecord[]>('/api/admin/services');
  return data;
}

export async function updateAdminService(
  serviceId: string,
  payload: AdminServiceUpdatePayload,
) {
  const { data } = await api.patch<AdminServiceRecord>(
    `/api/admin/services/${serviceId}`,
    payload,
  );
  return data;
}

export async function forceEndAdminParty(partyId: string, reason?: string) {
  const { data } = await api.post<AdminPartyRecord>(
    `/api/admin/parties/${partyId}/force-end`,
    { reason },
  );
  return data;
}

export async function fetchAdminReports(params?: {
  keyword?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<ReportRecord[]> {
  const { data } = await api.get<ReportRecord[]>('/api/admin/reports', {
    params,
  });
  return data;
}

export async function updateAdminReportStatus(
  reportId: string,
  status: string,
) {
  const { data } = await api.patch<ReportRecord>(
    `/api/admin/reports/${reportId}`,
    { status },
  );
  return data;
}

export async function fetchAdminReceipts(params?: {
  keyword?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<ReceiptRecord[]> {
  const { data } = await api.get<ReceiptRecord[]>('/api/admin/receipts', {
    params,
  });
  return data;
}

export async function updateAdminReceiptStatus(
  receiptId: string,
  status: string,
) {
  const { data } = await api.patch<ReceiptRecord>(
    `/api/admin/receipts/${receiptId}`,
    { status },
  );
  return data;
}

export async function fetchAdminSettlements(params?: {
  keyword?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<SettlementRecord[]> {
  const { data } = await api.get<SettlementRecord[]>('/api/admin/settlements', {
    params,
  });
  return data;
}

export async function updateAdminSettlementStatus(
  settlementId: string,
  status: string,
) {
  const { data } = await api.patch<SettlementRecord>(
    `/api/admin/settlements/${settlementId}`,
    { status },
  );
  return data;
}

export async function fetchAdminLogs(params?: {
  keyword?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<SystemLogRecord[]> {
  const { data } = await api.get<SystemLogRecord[]>('/api/admin/logs', {
    params,
  });
  return data;
}

export function getAdminErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(', ');
    }
    if (
      typeof detail === 'string' &&
      detail.includes('value out of int32 range')
    ) {
      return '가격은 2,147,483,647원 이하로 입력해야 합니다.';
    }
    return (
      detail ||
      error.response?.data?.message ||
      error.message ||
      '관리자 요청 처리 중 오류가 발생했습니다.'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '관리자 요청 처리 중 오류가 발생했습니다.';
}
