export type ReportTargetType = 'USER';
export type ReportStatus = '접수' | '검토중' | '처리' | '기각';
export type FilterType = '전체' | ReportStatus;

export interface ReportItem {
  id: string;
  type: ReportTargetType;
  target: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  targetId: string;
}
