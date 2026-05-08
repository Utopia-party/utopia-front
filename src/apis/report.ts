import { api } from './api';

export type ReportCategory = 'PROFANITY' | 'SCAM' | 'SPAM' | 'NO_SHOW';
export type ReportStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ReportEvidence {
  id: string;
  object_key: string;
  original_filename?: string | null;
  content_type?: string | null;
  file_size?: number | null;
  created_at: string;
  url?: string | null;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  target_type: 'USER';
  target_id: string;
  target_snapshot_name?: string | null;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  action_result_code: string;
  admin_memo?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  evidences: ReportEvidence[];
}

export interface ReportSummary {
  pending: number;
  in_review: number;
  approved: number;
  rejected: number;
}

export interface CreateReportPayload {
  targetIdentifier: string;
  category: ReportCategory;
  description: string;
  files: File[];
}

export async function createReport(
  payload: CreateReportPayload,
): Promise<ReportItem> {
  const formData = new FormData();
  formData.append('target_identifier', payload.targetIdentifier);
  formData.append('category', payload.category);
  formData.append('description', payload.description);

  payload.files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post<ReportItem>('/api/reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function fetchMyReports(
  status?: ReportStatus,
): Promise<ReportItem[]> {
  const response = await api.get<ReportItem[]>('/api/reports', {
    params: status ? { status } : undefined,
  });

  return response.data;
}

export async function fetchMyReportSummary(): Promise<ReportSummary> {
  const response = await api.get<ReportSummary>('/api/reports/summary');
  return response.data;
}
