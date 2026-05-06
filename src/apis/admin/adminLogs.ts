import { api } from '../api';

export type SystemLogRecord = {
  id: string;
  timestamp: string;
  type: string;
  source: string;
  message: string;
  actor: string;
  actorType: string;
  ipAddress?: string | null;
};

export async function fetchAdminLogs(params?: {
  keyword?: string;
  type?: string;
  actor_type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<SystemLogRecord[]> {
  const { data } = await api.get<SystemLogRecord[]>('/api/admin/logs', {
    params,
  });
  return data;
}
