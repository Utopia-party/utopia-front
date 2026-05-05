import { api } from '../api';

export type AdminRoleRecord = {
  id: string;
  userId: string;
  adminId: string;
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageServices: boolean;
  canManageParties: boolean;
  canManageQuickMatch: boolean;
  canManageReports: boolean;
  canManageChatModeration: boolean;
  canManageCaptcha: boolean;
  canApproveSettlements: boolean;
  canManagePayments: boolean;
  canViewLogs: boolean;
  canViewCloudMonitoring: boolean;
  canManageAdmins: boolean;
  canManageHandOcr: boolean;
  lastUpdated: string;
  updatedBy: string;
};

export type AdminRoleUpdatePayload = Omit<
  AdminRoleRecord,
  'id' | 'userId' | 'adminId' | 'lastUpdated' | 'updatedBy'
>;

export type AdminPermissions = AdminRoleUpdatePayload;

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
): Promise<AdminRoleRecord> {
  const { data } = await api.put<AdminRoleRecord>(`/api/admin/roles/${userId}`, payload);
  return data;
}
