// ===== 신고 관리 =====
export interface Report {
  id: string;
  type: string;
  target: string;
  reason: string;
  status: string;
  content: string;
  createdAt: string;
}

export const reportsData: Report[] = [
  {
    id: 'rpt-001',
    type: '사용자',
    target: 'user_02',
    reason: '욕설/비방',
    status: '접수',
    content: 'AI처리',
    createdAt: '2026-03-10',
  },
  {
    id: 'rpt-002',
    type: '파티',
    target: 'party_101',
    reason: '사기/불이행',
    status: '처리',
    content: '이의제기',
    createdAt: '2026-03-09',
  },
  {
    id: 'rpt-003',
    type: '채팅',
    target: 'chatroom_88',
    reason: '스팸/도배',
    status: '기각',
    content: 'AI처리',
    createdAt: '2026-03-08',
  },
  {
    id: 'rpt-004',
    type: '사용자',
    target: 'user_15',
    reason: '부적절한 프로필',
    status: '접수',
    content: '',
    createdAt: '2026-03-10',
  },
  {
    id: 'rpt-005',
    type: '파티',
    target: 'party_205',
    reason: '허위 정보',
    status: '처리',
    content: '',
    createdAt: '2026-03-07',
  },
  {
    id: 'rpt-006',
    type: '사용자',
    target: 'user_08',
    reason: '욕설/비방',
    status: 'AI처리',
    content: 'AI처리',
    createdAt: '2026-03-06',
  },
  {
    id: 'rpt-007',
    type: '채팅',
    target: 'chatroom_42',
    reason: '개인정보 노출',
    status: '이의제기',
    content: '',
    createdAt: '2026-03-05',
  },
];

// ===== 영수증 승인 =====
export interface Receipt {
  id: string;
  userId: string;
  partyId: string;
  ocrAmount: number;
  status: string;
  createdAt: string;
}

export const receiptsData: Receipt[] = [
  {
    id: 'r_001',
    userId: 'user_01',
    partyId: 'party_101',
    ocrAmount: 12000,
    status: '대기',
    createdAt: '2026-03-10',
  },
  {
    id: 'r_002',
    userId: 'user_02',
    partyId: 'party_205',
    ocrAmount: 8000,
    status: '승인',
    createdAt: '2026-03-09',
  },
  {
    id: 'r_003',
    userId: 'user_03',
    partyId: 'party_300',
    ocrAmount: 9500,
    status: '거절',
    createdAt: '2026-03-08',
  },
  {
    id: 'r_004',
    userId: 'user_05',
    partyId: 'party_101',
    ocrAmount: 17000,
    status: '대기',
    createdAt: '2026-03-10',
  },
  {
    id: 'r_005',
    userId: 'user_07',
    partyId: 'party_310',
    ocrAmount: 14900,
    status: '승인',
    createdAt: '2026-03-07',
  },
];

// ===== 정산 승인 =====
export interface Settlement {
  id: string;
  partyId: string;
  leaderId: string;
  totalAmount: number;
  memberCount: number;
  billingMonth: string;
  status: string;
  createdAt: string;
}

export const settlementsData: Settlement[] = [
  {
    id: 'stl-001',
    partyId: 'party_101',
    leaderId: 'user_01',
    totalAmount: 8500,
    memberCount: 2,
    billingMonth: '2026-03',
    status: '대기',
    createdAt: '2026-03-02',
  },
  {
    id: 'stl-002',
    partyId: 'party_205',
    leaderId: 'user_09',
    totalAmount: 19800,
    memberCount: 4,
    billingMonth: '2026-03',
    status: '승인',
    createdAt: '2026-03-01',
  },
  {
    id: 'stl-003',
    partyId: 'party_300',
    leaderId: 'user_12',
    totalAmount: 29700,
    memberCount: 3,
    billingMonth: '2026-03',
    status: '거절',
    createdAt: '2026-02-28',
  },
  {
    id: 'stl-004',
    partyId: 'party_310',
    leaderId: 'user_03',
    totalAmount: 14900,
    memberCount: 6,
    billingMonth: '2026-03',
    status: '대기',
    createdAt: '2026-03-05',
  },
];

// ===== 시스템 로그 =====
export interface SystemLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  actor: string;
}

export const systemLogsData: SystemLog[] = [
  {
    id: 'sl-001',
    timestamp: '2026-03-01 10:12',
    type: 'ADMIN_ACTION',
    message: '신고 처리 완료 (report_881)',
    actor: 'admin_ops',
  },
  {
    id: 'sl-002',
    timestamp: '2026-03-01 09:48',
    type: 'SYSTEM',
    message: 'OCR 분석 실패 → 관리자 검토로 전환 (r_001)',
    actor: 'system',
  },
  {
    id: 'sl-003',
    timestamp: '2026-02-28 22:01',
    type: 'ERROR',
    message: 'DB timeout (payments 조회)',
    actor: 'api',
  },
  {
    id: 'sl-004',
    timestamp: '2026-02-28 18:30',
    type: 'ADMIN_ACTION',
    message: '사용자 u-003 강제 정지 처리',
    actor: 'admin_root',
  },
  {
    id: 'sl-005',
    timestamp: '2026-02-28 15:12',
    type: 'SYSTEM',
    message: '캡챠 세트 100개 생성 완료',
    actor: 'system',
  },
  {
    id: 'sl-006',
    timestamp: '2026-02-27 11:00',
    type: 'ADMIN_ACTION',
    message: '영수증 r_045 승인 처리',
    actor: 'admin_ops',
  },
  {
    id: 'sl-007',
    timestamp: '2026-02-27 09:22',
    type: 'ERROR',
    message: 'MinIO 연결 실패 (captcha-emojis 버킷)',
    actor: 'api',
  },
];
