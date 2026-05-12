import { useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  PartyPopper,
  Siren,
  MessagesSquare,
  ShieldAlert,
  ScanText,
  CreditCard,
  BadgeCheck,
  FileText,
  CloudCog,
  MessageCircleWarning,
  Zap,
  Globe,
  ChevronDown,
  BookOpenCheck,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';

interface ManualItem {
  question: string;
  answer: string;
}

interface AdminManualSection {
  id: string;
  icon: typeof LayoutDashboard;
  title: string;
  path: string;
  description: string;
  items: ManualItem[];
}

const sections: AdminManualSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: '통계 대시보드',
    path: '/admin',
    description: '전체 서비스 현황을 한눈에 확인합니다.',
    items: [
      { question: '대시보드에서 무엇을 볼 수 있나요?', answer: '신규 가입자 수, 활성 파티 수, 결제 현황, 신고 건수, 시스템 상태 등 서비스 전반의 주요 지표를 실시간으로 확인할 수 있습니다.' },
      { question: '통계 기간을 변경할 수 있나요?', answer: '대시보드 상단의 기간 필터를 통해 일별, 주별, 월별 통계를 조회할 수 있습니다.' },
    ],
  },
  {
    id: 'roles',
    icon: ShieldCheck,
    title: '권한 관리',
    path: '/admin/roles',
    description: '관리자 계정의 역할과 접근 권한을 설정합니다.',
    items: [
      { question: '관리자 권한은 어떻게 부여하나요?', answer: '권한 관리 페이지에서 사용자를 검색한 뒤 역할(슈퍼 관리자, 일반 관리자 등)을 지정할 수 있습니다. 권한 변경은 슈퍼 관리자만 가능합니다.' },
      { question: '권한별로 접근 가능한 메뉴가 다른가요?', answer: '네, 각 관리자 계정에 부여된 권한에 따라 사이드바에 표시되는 메뉴가 달라집니다. 권한이 없는 메뉴는 접근 시 차단됩니다.' },
    ],
  },
  {
    id: 'users',
    icon: Users,
    title: '사용자 관리',
    path: '/admin/users',
    description: '회원 목록 조회, 신뢰도 점수 조정, 계정 정지를 처리합니다.',
    items: [
      { question: '특정 사용자를 검색하는 방법은?', answer: '사용자 관리 페이지 상단 검색창에 닉네임 또는 이메일을 입력하면 해당 사용자를 찾을 수 있습니다.' },
      { question: '사용자 신뢰도 점수를 직접 조정할 수 있나요?', answer: '사용자 상세 화면에서 신뢰도 점수를 수동으로 조정할 수 있습니다. 조정 사유를 반드시 기록해야 하며, 이력은 시스템 로그에 남습니다.' },
      { question: '계정 정지와 영구 차단의 차이는?', answer: '계정 정지는 일정 기간 서비스 이용을 제한하며, 기간 만료 후 자동 해제됩니다. 영구 차단은 IP 및 기기 Fingerprint 기반으로 재가입도 차단됩니다.' },
    ],
  },
  {
    id: 'appeals',
    icon: MessageCircleWarning,
    title: '이의신청 관리',
    path: '/admin/appeals',
    description: '사용자가 제출한 제재 이의신청을 검토하고 처리합니다.',
    items: [
      { question: '이의신청 처리 순서는?', answer: '이의신청 목록에서 대기중 항목을 선택 → 제재 사유와 사용자 신청 내용 검토 → 승인(제재 해제) 또는 기각(제재 유지) 선택 → 처리 메모 작성 후 저장. 처리 결과는 사용자에게 알림으로 전송됩니다.' },
      { question: '이의신청 승인 시 자동으로 계정이 복구되나요?', answer: '네, 승인 처리 시 해당 제재가 자동으로 해제되고 사용자 계정이 복구됩니다. 신뢰도 점수도 제재 이전 수준으로 조정됩니다.' },
    ],
  },
  {
    id: 'services',
    icon: Globe,
    title: '구독 서비스 관리',
    path: '/admin/services',
    description: '플랫폼에서 지원하는 구독 서비스 목록을 관리합니다.',
    items: [
      { question: '새 구독 서비스를 추가하려면?', answer: '구독 서비스 페이지에서 서비스 추가 버튼을 눌러 서비스명, 카테고리, 로고 이미지, 원가 등을 입력하면 즉시 반영됩니다.' },
      { question: '서비스 카테고리는 어떻게 나뉘나요?', answer: 'OTT, 음악/멤버십, 교육/도서, 생산성/기타 4개 카테고리로 구분됩니다. 서비스 추가 시 카테고리를 선택해야 합니다.' },
    ],
  },
  {
    id: 'parties',
    icon: PartyPopper,
    title: '파티 관리',
    path: '/admin/parties',
    description: '생성된 파티 목록을 조회하고 강제 종료 등을 처리합니다.',
    items: [
      { question: '파티를 강제 종료할 수 있나요?', answer: '파티 관리 페이지에서 해당 파티를 선택 후 강제 종료 버튼을 누르면 파티가 즉시 종료됩니다. 참여 중인 멤버에게 알림이 전송됩니다.' },
      { question: '파티별 채팅 로그를 볼 수 있나요?', answer: '파티 상세 화면에서 해당 파티의 채팅 로그를 조회할 수 있습니다. 분쟁 처리 시 증거 자료로 활용됩니다.' },
    ],
  },
  {
    id: 'quick-match',
    icon: Zap,
    title: '빠른매칭 관리',
    path: '/admin/quick-match',
    description: '빠른매칭 요청 현황 및 매칭 알고리즘 학습 데이터를 관리합니다.',
    items: [
      { question: '빠른매칭 학습 데이터란 무엇인가요?', answer: '사용자가 매칭 후 참여 확정/취소한 데이터가 학습 이벤트로 수집됩니다. 이 데이터는 매칭 알고리즘 성능 개선에 활용됩니다.' },
      { question: '매칭 요청이 쌓여있을 때 처리 방법은?', answer: '빠른매칭 관리 페이지에서 대기 중인 요청 목록을 확인할 수 있으며, 시스템이 자동으로 처리합니다. 장시간 매칭되지 않는 요청은 수동으로 취소 처리할 수 있습니다.' },
    ],
  },
  {
    id: 'reports',
    icon: Siren,
    title: '신고 관리',
    path: '/admin/reports',
    description: '사용자 신고 접수 건을 검토하고 제재 여부를 결정합니다.',
    items: [
      { question: '신고 처리 절차는?', answer: '신고 목록에서 미처리 건을 선택 → 신고 내용, 첨부 파일, 채팅 로그 확인 → 처리(제재 적용) 또는 기각 선택 → 처리 메모 입력 후 저장. 결과는 신고자에게 알림으로 전달됩니다.' },
      { question: '신고된 사용자에게 자동 제재가 적용되나요?', answer: '신고 자체로는 자동 제재가 적용되지 않습니다. 관리자가 검토 후 처리 결정을 내려야 신뢰도 점수 감점 및 제재가 실행됩니다.' },
    ],
  },
  {
    id: 'moderation',
    icon: MessagesSquare,
    title: '채팅 모더레이션',
    path: '/admin/moderation',
    description: 'AI가 탐지한 욕설·혐오 메시지 이력을 확인하고 임계값을 조정합니다.',
    items: [
      { question: 'AI 탐지 임계값은 무엇인가요?', answer: 'KR-ELECTRA 모델이 메시지를 분류할 때 사용하는 기준값입니다. none 확률 ≥ 0.95면 통과, score ≥ 0.97이면 즉시 차단됩니다. 이 값은 모더레이션 설정 화면에서 조정할 수 있습니다.' },
      { question: '오탐(정상 메시지를 차단)이 발생했을 때는?', answer: '모더레이션 이력에서 해당 메시지를 찾아 정상 처리로 변경할 수 있습니다. 오탐 케이스는 향후 모델 재학습 데이터로 활용됩니다.' },
    ],
  },
  {
    id: 'captcha',
    icon: ShieldAlert,
    title: '캡챠 관리',
    path: '/admin/captcha',
    description: 'GAN 기반 이미지 캡챠 동작 현황 및 통과율을 모니터링합니다.',
    items: [
      { question: '캡챠 통과율이 낮을 때 대응 방법은?', answer: '캡챠 관리 페이지에서 난이도 설정을 조정하거나 GAN 생성 이모지 품질 필터 임계값을 변경할 수 있습니다. 변경 사항은 즉시 반영됩니다.' },
      { question: '봇 탐지 결과를 확인할 수 있나요?', answer: 'L0 LSTM 분석 결과와 L1 GAN 캡챠 통과/차단 통계를 캡챠 관리 페이지에서 확인할 수 있습니다.' },
    ],
  },
  {
    id: 'handocr',
    icon: ScanText,
    title: 'HandOCR 캡챠',
    path: '/admin/handocr',
    description: 'L2 멀티모달 인증(손 포즈+OCR) 제출 이력을 검토합니다.',
    items: [
      { question: 'HandOCR 인증 실패가 많을 때는?', answer: 'HandOCR 관리 페이지에서 실패 이유별 통계를 확인할 수 있습니다. OCR 인식률이 낮은 경우 문자 생성 방식을, 손 포즈 실패가 많으면 MediaPipe 감지 임계값을 조정하세요.' },
      { question: '수동으로 인증을 승인할 수 있나요?', answer: '특수한 경우(신체적 제한 등) 관리자가 HandOCR 인증 제출 이력에서 해당 건을 수동 승인 처리할 수 있습니다.' },
    ],
  },
  {
    id: 'settlements',
    icon: BadgeCheck,
    title: '파티 정산 관리',
    path: '/admin/settlements',
    description: '파티 정산 요청을 확인하고 처리 상태를 관리합니다.',
    items: [
      { question: '정산 승인 절차는?', answer: '정산 목록에서 대기 중인 건을 선택 → 파티 정보, 결제 금액, 참여 인원 확인 → 승인 버튼 클릭. 승인 시 에스크로에 보관된 자금이 방장에게 정산됩니다.' },
      { question: '정산 분쟁이 발생했을 때는?', answer: '분쟁 건은 채팅 로그와 결제 기록을 함께 검토합니다. 정산 관리 페이지에서 해당 파티의 채팅 로그 보기를 통해 대화 내용을 확인할 수 있습니다.' },
    ],
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: '매출 내역',
    path: '/admin/payments',
    description: '플랫폼 전체 결제 내역 및 수수료 매출을 조회합니다.',
    items: [
      { question: '결제 취소 처리는 어떻게 하나요?', answer: '매출 내역 페이지에서 해당 결제 건을 선택 후 취소 버튼을 눌러 처리합니다. 토스페이먼츠 연동으로 즉시 환불이 진행됩니다.' },
      { question: '기간별 매출 통계를 볼 수 있나요?', answer: '상단 기간 필터로 일별, 월별 매출을 조회할 수 있습니다. CSV 다운로드 기능도 지원합니다.' },
    ],
  },
  {
    id: 'logs',
    icon: FileText,
    title: '시스템 로그',
    path: '/admin/logs',
    description: '관리자 활동 이력 및 시스템 이벤트 로그를 확인합니다.',
    items: [
      { question: '어떤 활동이 로그에 기록되나요?', answer: '관리자의 모든 처리 활동(사용자 제재, 신고 처리, 정산 승인 등), 시스템 자동 이벤트, AI 탐지 결과 등이 타임스탬프와 함께 기록됩니다.' },
      { question: '로그를 삭제할 수 있나요?', answer: '보안 및 감사 목적으로 로그는 삭제할 수 없습니다. 조회 및 필터링만 가능합니다.' },
    ],
  },
  {
    id: 'cloud-monitor',
    icon: CloudCog,
    title: '클라우드 모니터링',
    path: '/admin/cloud-monitor',
    description: 'AWS/GCP 인프라 상태 및 AI 모델 서버 헬스를 모니터링합니다.',
    items: [
      { question: 'AI 서버 상태가 비정상일 때는?', answer: '클라우드 모니터링 페이지에서 각 서버(ML 추론 서버, Ollama LLM 서버 등)의 상태를 확인합니다. 비정상 상태 시 재시작 버튼을 통해 서버를 재구동할 수 있습니다.' },
    ],
  },
];

function AccordionItem({ question, answer }: ManualItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-bold text-slate-800 text-sm">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-7 text-slate-600">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function AdminManualPage() {
  const navigate = useNavigate();

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-slate-50">
      {/* 헤더 */}
      <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-600 mb-5">
            <BookOpenCheck className="h-4 w-4" />
            관리자 사용 설명서
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Party-Up 관리자 매뉴얼
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                대시보드, 사용자·파티·신고 관리부터 AI 캡챠 모니터링, 정산 처리까지
                관리자 기능 전반을 안내합니다.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                관리자 페이지로
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" />
                랜딩으로
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                      {section.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(section.path)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95"
                >
                  페이지 이동
                </button>
              </div>
              <div className="grid gap-3">
                {section.items.map((item) => (
                  <AccordionItem key={item.question} {...item} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
