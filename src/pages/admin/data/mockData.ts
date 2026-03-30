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

// ===== 통계 대시보드 =====
export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export interface DashboardSummaryRow {
  label: string;
  value: string;
}

export const dashboardMetricsData: DashboardMetric[] = [
  {
    id: 'members',
    label: '회원 수',
    value: '1,284',
    helper: '현재 운영 중인 전체 회원 기준',
  },
  {
    id: 'today',
    label: '오늘 가입',
    value: '+12',
    helper: '오늘 00:00 이후 가입 완료',
  },
  {
    id: 'reports',
    label: '신고(접수)',
    value: '7',
    helper: '실시간 검토 대기 건수',
  },
  {
    id: 'settlements',
    label: '정산 승인 대기',
    value: '3',
    helper: '관리자 승인 대기 상태',
  },
];

export const dashboardMemberStatsData: DashboardSummaryRow[] = [
  { label: '활성 사용자(가입)', value: '612' },
  { label: '정지 사용자', value: '18' },
  { label: '영구정지', value: '4' },
];

export const dashboardSalesStatsData: DashboardSummaryRow[] = [
  { label: '이번달 승인 금액', value: '₩ 3,240,000' },
  { label: '대기 금액', value: '₩ 420,000' },
  { label: '거절 금액', value: '₩ 90,000' },
];

// ===== 권한 관리 =====
export interface AdminRoleRecord {
  id: string;
  adminId: string;
  role: 'ROOT' | 'OPS' | 'CS';
  scope: string;
  lastUpdated: string;
  updatedBy: string;
}

export const adminRolesData: AdminRoleRecord[] = [
  {
    id: 'role-001',
    adminId: 'root_admin',
    role: 'ROOT',
    scope: '전체 시스템 / 승인 / 정책',
    lastUpdated: '2026-03-29 09:10',
    updatedBy: 'system',
  },
  {
    id: 'role-002',
    adminId: 'admin_ops',
    role: 'OPS',
    scope: '신고 / 정산 / 영수증',
    lastUpdated: '2026-03-28 14:20',
    updatedBy: 'root_admin',
  },
  {
    id: 'role-003',
    adminId: 'admin_cs',
    role: 'CS',
    scope: '사용자 문의 / 파티 운영',
    lastUpdated: '2026-03-27 17:40',
    updatedBy: 'root_admin',
  },
  {
    id: 'role-004',
    adminId: 'admin_audit',
    role: 'OPS',
    scope: '로그 조회 / 감사 이력',
    lastUpdated: '2026-03-26 11:05',
    updatedBy: 'root_admin',
  },
];

// ===== 사용자 관리 =====
export interface AdminUserRecord {
  id: string;
  nickname: string;
  status: '정상' | '주의' | '정지';
  reportCount: number;
  partyCount: number;
  trustScore: number;
  lastActive: string;
}

export const adminUsersData: AdminUserRecord[] = [
  {
    id: 'user_01',
    nickname: '파티메이커',
    status: '정상',
    reportCount: 0,
    partyCount: 4,
    trustScore: 96,
    lastActive: '10분 전',
  },
  {
    id: 'user_02',
    nickname: 'ott_holic',
    status: '주의',
    reportCount: 3,
    partyCount: 1,
    trustScore: 72,
    lastActive: '1시간 전',
  },
  {
    id: 'user_03',
    nickname: 'bundle_fan',
    status: '정상',
    reportCount: 1,
    partyCount: 2,
    trustScore: 88,
    lastActive: '어제',
  },
  {
    id: 'user_04',
    nickname: 'late_cancel',
    status: '정지',
    reportCount: 5,
    partyCount: 0,
    trustScore: 38,
    lastActive: '2일 전',
  },
  {
    id: 'user_05',
    nickname: 'musicmate',
    status: '주의',
    reportCount: 2,
    partyCount: 3,
    trustScore: 67,
    lastActive: '방금',
  },
];

// ===== 파티 관리 =====
export interface AdminPartyRecord {
  id: string;
  service: string;
  leaderId: string;
  memberCount: number;
  status: '운영중' | '모집중' | '위험' | '종료 예정';
  reportCount: number;
  monthlyAmount: number;
  lastPayment: string;
}

export const adminPartiesData: AdminPartyRecord[] = [
  {
    id: 'party_01',
    service: 'Netflix 프리미엄',
    leaderId: 'leader_301',
    memberCount: 4,
    status: '운영중',
    reportCount: 0,
    monthlyAmount: 17000,
    lastPayment: '정상 납부',
  },
  {
    id: 'party_02',
    service: 'YouTube Premium',
    leaderId: 'leader_145',
    memberCount: 3,
    status: '모집중',
    reportCount: 0,
    monthlyAmount: 14900,
    lastPayment: '정산 대기',
  },
  {
    id: 'party_03',
    service: 'Disney+',
    leaderId: 'leader_219',
    memberCount: 4,
    status: '위험',
    reportCount: 2,
    monthlyAmount: 13900,
    lastPayment: '미납 경고',
  },
  {
    id: 'party_04',
    service: 'Spotify Family',
    leaderId: 'leader_517',
    memberCount: 6,
    status: '종료 예정',
    reportCount: 1,
    monthlyAmount: 23900,
    lastPayment: '이번 주 종료',
  },
];
