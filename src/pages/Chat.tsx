import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Users,
  Calendar,
  Clock,
  RefreshCw,
  User,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../apis/api';
import { useAuthStore } from '../stores/authStore';

// PortOne V2 SDK 타입 선언
declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: object) => Promise<{
        code?: string;
        message?: string;
        paymentId?: string;
        transactionType?: string;
      }>;
    };
  }
}

interface Message {
  type: 'message' | 'system' | 'warning' | 'error';
  party_id?: string;
  user_id?: string;
  nickname?: string;
  profile_image?: string | null;
  content: string;
  created_at: string;
}

interface Member {
  user_id: string;
  nickname: string;
  role: string;
  status: string;
  profile_image?: string | null;
}

interface PartyInfo {
  party_id: string;
  title: string;
  description?: string | null;
  status?: string;
  max_members?: number | null;
  member_count?: number | null;
  monthly_price?: number | null;
  monthly_per_person?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  category_name?: string | null;
  service_name?: string | null;
  host_nickname?: string | null;
  members: Member[];
}

interface ProfileDrawerUser {
  user_id?: string;
  nickname?: string;
  profile_image?: string | null;
  role?: string;
  status?: string;
}

interface ProfileDrawerState {
  user: ProfileDrawerUser;
  top: number;
  left: number;
}

type PaymentStep = 'select' | 'card' | 'transfer' | 'ocr';
type PaymentMethod = 'card' | 'transfer' | null;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const WS_BASE =
  import.meta.env.VITE_WS_BASE_URL ??
  API_BASE.replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace('/api', '');

const PORTONE_STORE_ID = 'store-b7fa4153-0590-4d36-9750-6c2fb830a292';
const PORTONE_CHANNEL_KEY = 'channel-key-ea16ef59-fabb-44d6-be05-e54d3c197582';

const BANK_INFO = {
  bank: '신한은행',
  account: '110-612-944408',
  holder: '김성보',
};

const ROLE_LABEL: Record<string, string> = {
  leader: '리더',
  member: '멤버',
};

const STATUS_LABEL: Record<string, string> = {
  active: '정상',
  pending: '대기',
  banned: '정지',
  recruiting: '모집중',
  full: '모집완료',
  completed: '완료',
  canceled: '취소',
};

const CATEGORY_COLOR: Record<string, string> = {
  OTT: 'bg-blue-100 text-blue-700',
  '멤버십/음악': 'bg-green-100 text-green-700',
  '교육/도서': 'bg-purple-100 text-purple-700',
  생산성: 'bg-pink-100 text-pink-700',
  기타: 'bg-slate-100 text-slate-600',
};

// 프로필 이니셜
function getProfileInitial(nickname?: string | null) {
  if (!nickname) return '?';
  return nickname.trim().slice(0, 2).toUpperCase();
}

// 아바타 컴포넌트
function Avatar({
  nickname,
  profileImage,
  size = 'sm',
  onClick,
}: {
  nickname?: string | null;
  profileImage?: string | null;
  size?: 'sm' | 'md';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';

  const content =
    profileImage && !imgError ? (
      <img
        src={profileImage}
        alt={nickname ?? 'profile'}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    ) : (
      getProfileInitial(nickname)
    );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="프로필 열기"
        className={`${sizeClass} rounded-full bg-primary text-white font-extrabold flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary text-white font-extrabold flex items-center justify-center overflow-hidden shrink-0`}
    >
      {content}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
      <div className="shrink-0 text-slate-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
        <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 프로필 서랍
// ────────────────────────────────────────────────
function ProfileDrawer({
  user,
  top,
  left,
  onClose,
  onProfileInfo,
  onReport,
}: {
  user: ProfileDrawerUser;
  top: number;
  left: number;
  onClose: () => void;
  onProfileInfo: () => void;
  onReport: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70]" onClick={onClose}>
      <div
        className="absolute w-[280px] overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Avatar
              nickname={user.nickname}
              profileImage={user.profile_image}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">
                {user.nickname ?? '익명'}
              </p>

              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {user.role && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                )}
                {user.status && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {STATUS_LABEL[user.status] ?? user.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200" />

        <button
          type="button"
          onClick={onProfileInfo}
          className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold text-slate-800 hover:bg-slate-50"
        >
          <User size={18} className="text-slate-500" />
          프로필 정보
        </button>

        <div className="mx-5 h-px bg-slate-200" />

        <button
          type="button"
          onClick={onReport}
          className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold text-red-600 hover:bg-red-50"
        >
          <AlertTriangle size={18} />
          신고
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 결제 모달
// ────────────────────────────────────────────────
function PaymentModal({
  onClose,
  partyTitle,
  nickname,
}: {
  onClose: () => void;
  partyTitle: string;
  nickname: string;
}) {
  const [step, setStep] = useState<PaymentStep>('select');
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ocrFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.getElementById('portone-sdk')) return;
    const script = document.createElement('script');
    script.id = 'portone-sdk';
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    return () => {
      if (ocrPreview) URL.revokeObjectURL(ocrPreview);
    };
  }, [ocrPreview]);

  const handleCardPayment = async () => {
    if (!window.PortOne) {
      alert('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsLoading(true);
    const orderId = `order-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    try {
      const response = await window.PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: orderId,
        orderName: `${partyTitle} 정산`,
        totalAmount: 100,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: { fullName: nickname },
      });
      if (response?.code) {
        alert(`결제 실패: ${response.message ?? '알 수 없는 오류'}`);
      } else {
        setPaymentId(response?.paymentId ?? orderId);
        setPaymentDone(true);
        setStep('ocr');
      }
    } catch (err) {
      console.error('결제 오류:', err);
      alert('결제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setOcrFile(file);

    if (ocrPreview) URL.revokeObjectURL(ocrPreview);
    if (file) {
      setOcrPreview(URL.createObjectURL(file));
    } else {
      setOcrPreview(null);
    }
  };

  const handleOcrSubmit = () => {
    if (!ocrFile) {
      alert('파일을 선택해주세요.');
      return;
    }
    alert(
      `"${ocrFile.name}" OCR 인증 요청이 제출되었습니다!\nOCR 분석 → 자동 승인, 실패 시 관리자 검토`,
    );
    onClose();
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_INFO.account).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">결제</h2>
            <p className="text-xs text-slate-400 mt-0.5">{partyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl font-light"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {step === 'select' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 font-medium">
                결제 수단을 선택해주세요
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setMethod('card');
                    setStep('card');
                  }}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      카드 결제
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      100원 테스트
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMethod('transfer');
                    setStep('transfer');
                  }}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🏦</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      계좌 입금
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">OCR 인증</p>
                  </div>
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center">
                결제 완료 후 영수증/이체확인서로 OCR 인증을 진행합니다
              </p>
            </div>
          )}
          {step === 'card' && (
            <div className="flex flex-col gap-5">
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">파티명</span>
                  <span className="font-semibold text-slate-800">
                    {partyTitle}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">결제자</span>
                  <span className="font-semibold text-slate-800">
                    {nickname}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
                  <span className="text-slate-500">결제 금액</span>
                  <span className="font-extrabold text-primary text-base">
                    100원 (테스트)
                  </span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ 테스트 결제
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  테스트 환경에서 실제 결제는 발생하지 않습니다.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  이전
                </button>
                <button
                  onClick={handleCardPayment}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      처리중...
                    </>
                  ) : (
                    '결제하기 💳'
                  )}
                </button>
              </div>
            </div>
          )}
          {step === 'transfer' && (
            <div className="flex flex-col gap-5">
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  입금 계좌 정보
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">은행</span>
                  <span className="font-semibold">{BANK_INFO.bank}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">계좌번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">
                      {BANK_INFO.account}
                    </span>
                    <button
                      onClick={handleCopyAccount}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20"
                    >
                      {copied ? '복사됨 ✓' : '복사'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">예금주</span>
                  <span className="font-semibold">{BANK_INFO.holder}</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium">
                  📋 입금 후 이체확인서 업로드 필요
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  입금 완료 후 아래 버튼을 눌러 이체확인서를 OCR 인증해주세요.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  이전
                </button>
                <button
                  onClick={() => setStep('ocr')}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90"
                >
                  입금했어요 →
                </button>
              </div>
            </div>
          )}
          {step === 'ocr' && (
            <div className="flex flex-col gap-5">
              {paymentDone && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-green-500 text-lg">✅</span>
                  <div>
                    <p className="text-xs text-green-700 font-bold">
                      결제 완료!
                    </p>
                    {paymentId && (
                      <p className="text-xs text-green-600 font-mono mt-0.5">
                        ID: {paymentId}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {method === 'card' ? '결제 영수증' : '이체확인서'} 업로드
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  OCR로 자동 분석 → 실패 시 관리자 검토
                </p>
                <div
                  onClick={() => ocrFileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {ocrPreview ? (
                    <img
                      src={ocrPreview}
                      alt="미리보기"
                      className="max-h-32 rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <span className="text-3xl">📄</span>
                      <p className="text-sm text-slate-500 font-medium">
                        파일 선택 또는 드래그
                      </p>
                      <p className="text-xs text-slate-400">이미지, PDF 가능</p>
                    </>
                  )}
                </div>
                {ocrFile && (
                  <p className="text-xs text-slate-500 mt-2 text-center truncate">
                    선택됨: {ocrFile.name}
                  </p>
                )}
                <input
                  ref={ocrFileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleOcrFileChange}
                />
              </div>
              <div className="flex gap-3">
                {!paymentDone && (
                  <button
                    onClick={() =>
                      setStep(method === 'card' ? 'card' : 'transfer')
                    }
                    className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    이전
                  </button>
                )}
                <button
                  onClick={handleOcrSubmit}
                  disabled={!ocrFile}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 disabled:opacity-40"
                >
                  OCR 인증 요청 🔍
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 메인 Chat 컴포넌트
// ────────────────────────────────────────────────
export default function Chat() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [profileDrawer, setProfileDrawer] = useState<ProfileDrawerState | null>(
    null,
  );

  const nickname = user?.nickname ?? '익명';
  const userId = user?.user_id ?? 'guest';
  const myProfileImage = user?.profile_image ?? null;

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => setUserReady(true), 500);
      return () => clearTimeout(t);
    }
    setUserReady(true);
  }, [user]);

  useEffect(() => {
    if (!partyId) return;
    api
      .get(`/chat/parties/${partyId}/messages`)
      .then(({ data }) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]));
    api
      .get(`/chat/parties/${partyId}/info`)
      .then(({ data }) => setPartyInfo(data))
      .catch(() => {});
  }, [partyId]);

  useEffect(() => {
    if (!partyId || !userReady) return;
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const ws = new WebSocket(
      `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(
        nickname,
      )}&user_id=${encodeURIComponent(userId)}`,
    );
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg: Message = JSON.parse(e.data);
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.error('메시지 파싱 에러:', err);
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [partyId, userReady, nickname, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!profileDrawer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileDrawer(null);
      }
    };

    const handleResize = () => setProfileDrawer(null);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [profileDrawer]);

  const sendMessage = useCallback(() => {
    if (
      !input.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    wsRef.current.send(input.trim());
    setInput('');
  }, [input]);

  const getMemberMeta = useCallback(
    (targetUserId?: string) => {
      const member = partyInfo?.members?.find(
        (m) => m.user_id === targetUserId,
      );
      if (!member) {
        return {
          role: undefined,
          status: undefined,
          profile_image: null as string | null,
        };
      }
      return {
        role: member.role,
        status: member.status,
        profile_image: member.profile_image ?? null,
      };
    },
    [partyInfo],
  );

  const openProfileDrawer = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, targetUser: ProfileDrawerUser) => {
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const drawerWidth = 280;
      const drawerHeight = 210;

      const hasRightSpace =
        rect.right + 12 + drawerWidth <= window.innerWidth - 12;

      const left = hasRightSpace
        ? rect.right + 12
        : Math.max(12, rect.left - drawerWidth - 12);

      const top = Math.min(
        Math.max(12, rect.top - 8),
        window.innerHeight - drawerHeight - 12,
      );

      setProfileDrawer({
        user: targetUser,
        top,
        left,
      });
    },
    [],
  );

  const closeProfileDrawer = useCallback(() => {
    setProfileDrawer(null);
  }, []);

  const handleProfileInfo = useCallback(() => {
    if (!profileDrawer) return;

    // TODO: 실제 프로필 상세 페이지가 있으면 navigate('/profile/...')로 교체
    alert(
      `${profileDrawer.user.nickname ?? '사용자'} 프로필 정보를 여기에 연결하면 됩니다.`,
    );
    setProfileDrawer(null);
  }, [profileDrawer]);

  const handleReportUser = useCallback(() => {
    if (!profileDrawer) return;

    // TODO: 실제 신고 모달 또는 신고 API 연결
    alert(
      `${profileDrawer.user.nickname ?? '사용자'} 신고 기능을 연결하면 됩니다.`,
    );
    setProfileDrawer(null);
  }, [profileDrawer]);

  const renderMessage = (msg: Message, i: number) => {
    const isMe = msg.nickname === nickname || msg.user_id === userId;
    const memberMeta = getMemberMeta(msg.user_id);

    if (msg.type === 'system') {
      return (
        <div key={i} className="flex justify-center">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {msg.content}
          </span>
        </div>
      );
    }

    if (msg.type === 'warning' || msg.type === 'error') {
      const isError = msg.type === 'error';
      return (
        <div key={i} className="flex justify-center">
          <span
            className={`text-xs border px-3 py-1.5 rounded-xl ${
              isError
                ? 'text-red-600 bg-red-50 border-red-200'
                : 'text-orange-600 bg-orange-50 border-orange-200'
            }`}
          >
            {msg.content}
          </span>
        </div>
      );
    }

    const senderImage = isMe
      ? myProfileImage
      : (msg.profile_image ?? memberMeta.profile_image ?? null);

    return (
      <div
        key={i}
        className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div className="shrink-0 mt-1">
          <Avatar
            nickname={msg.nickname}
            profileImage={senderImage}
            size="sm"
            onClick={(e) =>
              openProfileDrawer(e, {
                user_id: msg.user_id,
                nickname: msg.nickname,
                profile_image: senderImage,
                role: memberMeta.role,
                status: memberMeta.status,
              })
            }
          />
        </div>
        <div
          className={`flex flex-col gap-0.5 max-w-xs ${
            isMe ? 'items-end' : 'items-start'
          }`}
        >
          <p className="text-xs text-muted-foreground px-1">
            {msg.nickname ?? '익명'}
          </p>
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isMe
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border text-foreground rounded-bl-sm'
            }`}
          >
            {msg.content}
          </div>
          <p className="text-[10px] text-muted-foreground px-1">
            {msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </p>
        </div>
      </div>
    );
  };

  // 날짜 포맷
  const formatDate = (d?: string | null) => {
    if (!d) return '-';
    return new Date(d)
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.')
      .replace('.', '');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          partyTitle={partyInfo?.title ?? '파티'}
          nickname={nickname}
        />
      )}

      {profileDrawer && (
        <ProfileDrawer
          user={profileDrawer.user}
          top={profileDrawer.top}
          left={profileDrawer.left}
          onClose={closeProfileDrawer}
          onProfileInfo={handleProfileInfo}
          onReport={handleReportUser}
        />
      )}

      {/* 헤더 */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 파티 목록
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-foreground truncate">
            {partyInfo?.title ?? '채팅방'}
          </h1>
          <p className="text-xs text-muted-foreground">
            정산요청 · 영수증 인증 · 채팅 신고
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 pt-4 pb-1">
            <p className="text-sm font-bold text-foreground">메시지</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3 border border-border rounded-xl mx-5 mb-3 bg-white min-h-0">
            {messages.length > 0 ? (
              messages.map((msg, i) => renderMessage(msg, i))
            ) : (
              <p className="text-xs text-muted-foreground">
                [시스템] 채팅방이 생성되었습니다.
              </p>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="mx-5 mb-3 flex gap-2">
            <input
              className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary bg-background"
              placeholder="메시지 입력"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold disabled:opacity-40"
            >
              전송
            </button>
          </div>
          <div className="mx-5 mb-4 flex gap-3">
            <button className="flex-1 py-3 border border-border rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
              채팅 신고
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 py-3 border-2 border-primary rounded-2xl text-sm font-bold text-primary hover:bg-primary/5"
            >
              결제
            </button>
          </div>
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
          {/* 파티 멤버 */}
          <div className="p-5 border-b border-border">
            <p className="text-sm font-bold text-foreground mb-3">파티 멤버</p>
            {Array.isArray(partyInfo?.members) &&
            partyInfo.members.length > 0 ? (
              <div className="flex flex-col gap-1">
                {partyInfo.members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-2.5 py-1.5"
                  >
                    <Avatar
                      nickname={member.nickname}
                      profileImage={member.profile_image}
                      size="sm"
                      onClick={(e) =>
                        openProfileDrawer(e, {
                          user_id: member.user_id,
                          nickname: member.nickname,
                          profile_image: member.profile_image,
                          role: member.role,
                          status: member.status,
                        })
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.nickname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABEL[member.role] ?? member.role}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : member.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {STATUS_LABEL[member.status] ?? member.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                멤버 정보를 불러오는 중...
              </p>
            )}
          </div>

          {/* 파티 정보 */}
          <div className="p-5">
            {partyInfo?.category_name && (
              <div className="mb-3">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    CATEGORY_COLOR[partyInfo.category_name] ??
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  {partyInfo.category_name}
                </span>
              </div>
            )}

            <p className="text-sm font-bold text-foreground mb-3">파티 정보</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <InfoCard
                icon={<Users size={14} />}
                label="모집 인원"
                value={`${partyInfo?.member_count ?? '-'} / ${
                  partyInfo?.max_members ?? '-'
                }`}
              />
              <InfoCard
                icon={<Calendar size={14} />}
                label="시작일"
                value={formatDate(partyInfo?.start_date)}
              />
              <InfoCard
                icon={<Clock size={14} />}
                label="모집 마감"
                value={formatDate(partyInfo?.end_date)}
              />
              <InfoCard
                icon={<RefreshCw size={14} />}
                label="정산 주기"
                value="매월 1일"
              />
            </div>

            <div className="border-t border-slate-100 pt-3 mb-3">
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                정산 요약
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">총 비용</span>
                  <span className="font-semibold text-slate-900">
                    {partyInfo?.monthly_price != null
                      ? `${partyInfo.monthly_price.toLocaleString()}원`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">1인 부담</span>
                  <span className="font-bold text-primary">
                    {partyInfo?.monthly_per_person != null
                      ? `${partyInfo.monthly_per_person.toLocaleString()}원`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {partyInfo?.host_nickname && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  호스트
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">닉네임</span>
                  <span className="font-semibold text-slate-900">
                    {partyInfo.host_nickname}
                  </span>
                </div>
              </div>
            )}

            {partyInfo?.status && (
              <div className="mt-3">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    partyInfo.status === 'recruiting'
                      ? 'bg-orange-100 text-orange-600'
                      : partyInfo.status === 'full'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {STATUS_LABEL[partyInfo.status] ?? partyInfo.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
