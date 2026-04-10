export type ReportTargetType = 'USER';
export type ReportStatus = '접수' | '처리' | '기각';
export type FilterType = '전체' | ReportStatus;

export interface ReportItem {
  id: number;
  type: ReportTargetType;
  target: string;
  reason: string;
  status: ReportStatus;
}
