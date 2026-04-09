import axios from 'axios';
import { api } from './api';

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
};

export type DashboardSummaryRow = {
  label: string;
  value: string;
};

type AdminDashboardApiResponse = {
  metrics: DashboardMetric[];
  member_stats: DashboardSummaryRow[];
  sales_stats: DashboardSummaryRow[];
  today_summary: string;
};

export type AdminDashboard = {
  metrics: DashboardMetric[];
  memberStats: DashboardSummaryRow[];
  salesStats: DashboardSummaryRow[];
  todaySummary: string;
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
  sellingPrice: number;
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
  sellingPrice: number;
  logoImageKey?: string | null;
  isActive: boolean;
  commissionRate: number;
  leaderDiscountRate: number;
  referralDiscountRate: number;
};

export type AdminUserRecord = {
  id: string;
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
  service: string;
  leaderId: string;
  memberCount: number;
  status: '운영중' | '모집중' | '위험' | '종료 예정';
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
  leaderId: string;
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

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboardApiResponse>(
    '/api/admin/dashboard',
  );
  return {
    metrics: data.metrics,
    memberStats: data.member_stats,
    salesStats: data.sales_stats,
    todaySummary: data.today_summary,
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

export async function fetchAdminParties(): Promise<AdminPartyRecord[]> {
  const { data } = await api.get<AdminPartyRecord[]>('/api/admin/parties');
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

export async function fetchAdminReports(): Promise<ReportRecord[]> {
  const { data } = await api.get<ReportRecord[]>('/api/admin/reports');
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

export async function fetchAdminReceipts(): Promise<ReceiptRecord[]> {
  const { data } = await api.get<ReceiptRecord[]>('/api/admin/receipts');
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

export async function fetchAdminSettlements(): Promise<SettlementRecord[]> {
  const { data } = await api.get<SettlementRecord[]>('/api/admin/settlements');
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

export async function fetchAdminLogs(): Promise<SystemLogRecord[]> {
  const { data } = await api.get<SystemLogRecord[]>('/api/admin/logs');
  return data;
}

export function getAdminErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.detail ||
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
