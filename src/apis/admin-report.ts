import { api } from './api';
import { getAdminErrorMessage } from './admin';

export type AdminReportEvidenceRecord = {
  id: string;
  objectKey: string;
  originalFilename?: string | null;
  contentType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  url?: string | null;
};

export type ReportRecord = {
  id: string;
  type: string;
  target: string;
  reason: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  reporterId?: string | null;
  reporterNickname?: string | null;
  targetId?: string | null;
  targetSnapshotName?: string | null;
  actionResultCode?: string | null;
  adminMemo?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  evidences: AdminReportEvidenceRecord[];
};

type AdminReportEvidenceApiResponse = {
  id: string;
  object_key?: string | null;
  objectKey?: string | null;
  original_filename?: string | null;
  originalFilename?: string | null;
  content_type?: string | null;
  contentType?: string | null;
  file_size?: number | null;
  fileSize?: number | null;
  created_at?: string | null;
  createdAt?: string | null;
  url?: string | null;
};

type AdminReportApiResponse = {
  id: string;
  type?: string | null;
  target_type?: string | null;
  targetType?: string | null;
  target?: string | null;
  target_id?: string | null;
  targetId?: string | null;
  target_snapshot_name?: string | null;
  targetSnapshotName?: string | null;
  reason?: string | null;
  category?: string | null;
  status: string;
  content?: string | null;
  description?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  reporter_id?: string | null;
  reporterId?: string | null;
  reporter_nickname?: string | null;
  reporterNickname?: string | null;
  action_result_code?: string | null;
  actionResultCode?: string | null;
  admin_memo?: string | null;
  adminMemo?: string | null;
  reviewed_by?: string | null;
  reviewedBy?: string | null;
  reviewed_at?: string | null;
  reviewedAt?: string | null;
  evidences?: AdminReportEvidenceApiResponse[];
};

const REPORT_STATUS_LABEL: Record<string, string> = {
  PENDING: '접수',
  IN_REVIEW: '검토중',
  APPROVED: '처리',
  REJECTED: '기각',
  접수: '접수',
  검토중: '검토중',
  처리: '처리',
  기각: '기각',
};

const REPORT_CATEGORY_LABEL: Record<string, string> = {
  PROFANITY: '욕설/비방',
  SCAM: '사기/불이행',
  SPAM: '스팸/도배',
  욕설: '욕설/비방',
  사기: '사기/불이행',
  스팸: '스팸/도배',
};

const toDisplayStatus = (status: string) =>
  REPORT_STATUS_LABEL[status] ?? status;

const toApiStatus = (status: string) => {
  switch (status) {
    case '접수':
      return 'PENDING';
    case '검토중':
      return 'IN_REVIEW';
    case '처리':
      return 'APPROVED';
    case '기각':
      return 'REJECTED';
    default:
      return status;
  }
};

const toDisplayCategory = (category?: string | null) => {
  if (!category) return '-';
  return REPORT_CATEGORY_LABEL[category] ?? category;
};

const mapEvidence = (
  evidence: AdminReportEvidenceApiResponse,
): AdminReportEvidenceRecord => ({
  id: evidence.id,
  objectKey: evidence.object_key ?? evidence.objectKey ?? '',
  originalFilename:
    evidence.original_filename ?? evidence.originalFilename ?? null,
  contentType: evidence.content_type ?? evidence.contentType ?? null,
  fileSize: evidence.file_size ?? evidence.fileSize ?? null,
  createdAt: evidence.created_at ?? evidence.createdAt ?? '',
  url: evidence.url ?? null,
});

const mapReport = (report: AdminReportApiResponse): ReportRecord => {
  const target =
    report.target ??
    report.target_snapshot_name ??
    report.targetSnapshotName ??
    report.target_id ??
    report.targetId ??
    '-';

  return {
    id: report.id,
    type: report.type ?? report.target_type ?? report.targetType ?? '-',
    target,
    reason: toDisplayCategory(report.reason ?? report.category),
    status: toDisplayStatus(report.status),
    content: report.content ?? report.description ?? '',
    createdAt: report.created_at ?? report.createdAt ?? '',
    updatedAt: report.updated_at ?? report.updatedAt ?? null,
    reporterId: report.reporter_id ?? report.reporterId ?? null,
    reporterNickname:
      report.reporter_nickname ?? report.reporterNickname ?? null,
    targetId: report.target_id ?? report.targetId ?? null,
    targetSnapshotName:
      report.target_snapshot_name ?? report.targetSnapshotName ?? null,
    actionResultCode:
      report.action_result_code ?? report.actionResultCode ?? null,
    adminMemo: report.admin_memo ?? report.adminMemo ?? null,
    reviewedBy: report.reviewed_by ?? report.reviewedBy ?? null,
    reviewedAt: report.reviewed_at ?? report.reviewedAt ?? null,
    evidences: Array.isArray(report.evidences)
      ? report.evidences.map(mapEvidence)
      : [],
  };
};

export async function fetchAdminReports(params?: {
  keyword?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<ReportRecord[]> {
  const { data } = await api.get<AdminReportApiResponse[]>(
    '/api/admin/reports',
    {
      params,
    },
  );

  return data.map(mapReport);
}

export async function updateAdminReportStatus(
  reportId: string,
  status: string,
): Promise<ReportRecord> {
  const { data } = await api.patch<AdminReportApiResponse>(
    `/api/admin/reports/${reportId}`,
    { status: toApiStatus(status) },
  );

  return mapReport(data);
}

export { getAdminErrorMessage };
