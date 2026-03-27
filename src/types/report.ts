export type ReportTargetType = '사용자' | '파티' | '채팅';
export type ReportStatus = '접수' | '처리' | '기각';
export type FilterType = '전체' | ReportStatus;

export interface ReportItem {
  id: number;
  type: ReportTargetType;
  target: string;
  reason: string;
  status: ReportStatus;
}
