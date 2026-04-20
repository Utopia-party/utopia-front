import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { User, AlertTriangle } from 'lucide-react';
import { api } from '../apis/api';
import { useAuthStore } from '../stores/authStore';

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
  name?: string | null;
  role: string;
  status: string;
  trust_score?: number | null;
  joined_at?: string | null;
  profile_image?: string | null;
  is_active: boolean;
}

interface PartyInfo {
  party_id: string;
  title: string;
  status?: string;
  max_members?: number | null;
  member_count?: number | null;
  monthly_price?: number | null;
  leader_discount_rate?: number | null;
  referral_discount_rate?: number | null;
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

type PaymentStep = 'select' | 'card' | 'transfer';

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

const MEMBER_STATUS_LABEL: Record<string, string> = {
  active: '정상',
  pending: '대기',
  banned: '정지',
};

const PARTY_STATUS_LABEL: Record<string, string> = {
  recruiting: '모집중',
  full: '모집완료',
  active: '진행중',
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

function getProfileInitial(nickname?: string | null) {
  if (!nickname) return '?';
  return nickname.trim().slice(0, 2).toUpperCase();
}

function formatCurrency(value?: number | null) {
  if (value == null) return '-';
  return `${value.toLocaleString()}원`;
}

function formatRate(value?: number | null) {
  if (value == null) return '-';
  const percent = Math.abs(value) <= 1 ? value * 100 : value;
  return `${percent}%`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTrustScore(value?: number | null) {
  if (value == null) return '-';
  return `${Number(value).toFixed(1)}점`;
}

function displayMemberName(member: Member) {
  return member.name?.trim() || member.nickname || '';
}

function displayMemberSubLabel(member: Member) {
  const name = member.name?.trim();
  const nickname = member.nickname?.trim();
  if (name && nickname && name !== nickname) {
    return name;
  }
  return '';
}

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

function ProfileDrawer({
  user,
  top,
  left,
  isMe,
  onClose,
  onProfileInfo,
  onReport,
}: {
  user: ProfileDrawerUser;
  top: number;
  left: number;
  isMe: boolean;
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
                    {MEMBER_STATUS_LABEL[user.status] ?? user.status}
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
        {!isMe && (
          <>
            <div className="mx-5 h-px bg-slate-200" />
            <button
              type="button"
              onClick={onReport}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold text-red-600 hover:bg-red-50"
            >
              <AlertTriangle size={18} />
              신고
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span
        className={`text-right ${
          emphasized ? 'font-bold text-primary' : 'font-semibold text-slate-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MemberItem({ member }: { member: Member }) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50">
        <Avatar
          nickname={member.nickname}
          profileImage={member.profile_image ?? null}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {displayMemberName(member) || member.nickname}
          </p>
          {displayMemberSubLabel(member) && (
            <p className="truncate text-xs text-slate-500">
              {displayMemberSubLabel(member)}
            </p>
          )}
        </div>
      </div>

      <div className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-64 translate-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="mb-2 flex items-center gap-3">
          <Avatar
            nickname={member.nickname}
            profileImage={member.profile_image ?? null}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {displayMemberName(member) || member.nickname}
            </p>
            {displayMemberSubLabel(member) && (
              <p className="truncate text-xs text-slate-500">
                {displayMemberSubLabel(member)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-100 pt-2">
          <DetailRow
            label="역할"
            value={ROLE_LABEL[member.role] ?? member.role}
          />
          <DetailRow
            label="상태"
            value={MEMBER_STATUS_LABEL[member.status] ?? member.status}
          />
          <DetailRow
            label="신뢰도"
            value={formatTrustScore(member.trust_score)}
          />
          <DetailRow label="참여일" value={formatDate(member.joined_at)} />
          <DetailRow
            label="계정상태"
            value={member.is_active ? '활성' : '비활성'}
          />
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  onClose,
  partyId,
  partyTitle,
  nickname,
  monthlyPerPerson,
  onPaymentComplete,
}: {
  onClose: () => void;
  partyId: string;
  partyTitle: string;
  nickname: string;
  monthlyPerPerson: number | null;
  onPaymentComplete: () => void; // 결제 완료 콜백
}) {
  const [step, setStep] = useState<PaymentStep>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  const payAmount = monthlyPerPerson ?? 100;

  useEffect(() => {
    if (document.getElementById('portone-sdk')) return;
    const script = document.createElement('script');
    script.id = 'portone-sdk';
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleCardPayment = async () => {
    if (!window.PortOne) {
      alert('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsLoading(true);
    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const response = await window.PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: orderId,
        orderName: `${partyTitle} 정산`,
        totalAmount: payAmount,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: { fullName: nickname },
      });

      console.log('[PORTONE 응답]', JSON.stringify(response));

      if (!response) {
        alert('결제가 취소되었습니다.');
        return;
      }
      if (response?.code) {
        alert(`결제 실패: ${response.message ?? '알 수 없는 오류'}`);
        return;
      }

      await api.post('/api/payments/card/confirm', {
        party_id: partyId,
        pg_transaction_id: response?.paymentId ?? orderId,
        amount: payAmount,
      });

      setDoneMessage('카드 결제가 완료되었습니다!\n결제 승인이 확인되었어요.');
      setDone(true);
      onPaymentComplete(); // 버튼 비활성화 콜백
    } catch (err: any) {
      console.error('[결제 에러]', err);
      const detail =
        err?.response?.data?.detail ?? '결제 처리 중 오류가 발생했습니다.';
      alert(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferRegister = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/payments/transfer/register', {
        party_id: partyId,
        amount: payAmount,
      });
      setDoneMessage(
        '입금 정보가 등록되었습니다.\n관리자 확인 후 승인으로 변경됩니다.',
      );
      setDone(true);
      onPaymentComplete();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ?? '등록 중 오류가 발생했습니다.';
      alert(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_INFO.account).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white">결제 완료</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-xl font-light"
            >
              ✕
            </button>
          </div>
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
              ✅
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">
                처리 완료!
              </p>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                {doneMessage}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  onClick={() => setStep('card')}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      카드 결제
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">즉시 승인</p>
                  </div>
                </button>
                <button
                  onClick={() => setStep('transfer')}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🏦</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      계좌 입금
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">관리자 승인</p>
                  </div>
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">이번 달 결제 금액</span>
                <span className="font-extrabold text-slate-900">
                  {payAmount.toLocaleString()}원
                </span>
              </div>
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
                    {payAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium">
                  💳 카드 결제 후 즉시 승인
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  결제 완료 시 자동으로 승인 처리됩니다.
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
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
                  <span className="text-slate-500">입금 금액</span>
                  <span className="font-extrabold text-slate-900">
                    {payAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">
                  ⏳ 관리자 확인 후 승인
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  입금 후 아래 버튼을 누르면 관리자가 확인 후 승인 처리합니다.
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
                  onClick={handleTransferRegister}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      처리중...
                    </>
                  ) : (
                    '입금 완료했어요 ✓'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [profileDrawer, setProfileDrawer] = useState<ProfileDrawerState | null>(
    null,
  );
  const [alreadyPaid, setAlreadyPaid] = useState(false); // 이번 달 결제 여부

  const nicknameRef = useRef(user?.nickname ?? '익명');
  const userIdRef = useRef(user?.user_id ?? 'guest');
  const myProfileImage = user?.profile_image ?? null;

  useEffect(() => {
    if (user?.nickname) nicknameRef.current = user.nickname;
    if (user?.user_id) userIdRef.current = user.user_id;
  }, [user]);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userReadyRef = useRef(false);

  // 결제 상태 확인 함수
  const checkPaymentStatus = useCallback(async () => {
    if (!partyId) return;
    try {
      const { data } = await api.get(
        `/api/payments/status?party_id=${partyId}`,
      );
      setAlreadyPaid(data.paid);
    } catch {
      // 실패해도 무시
    }
  }, [partyId]);

  useEffect(() => {
    if (!partyId) return;

    setMessages([]);
    setPartyInfo(null);
    setAlreadyPaid(false);

    api
      .get(`/api/chat/parties/${partyId}/messages`)
      .then(({ data }) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('메시지 로딩 실패:', err);
        setMessages([]);
      });

    api
      .get(`/api/chat/parties/${partyId}/info`)
      .then(({ data }) => setPartyInfo(data))
      .catch((err) => {
        console.error('파티 정보 로딩 실패:', err);
        setPartyInfo(null);
      });

    checkPaymentStatus();
  }, [partyId, checkPaymentStatus]);

  useEffect(() => {
    if (!partyId) return;

    let cancelled = false;

    const connect = async () => {
      if (!userReadyRef.current) {
        await new Promise((r) => setTimeout(r, 600));
      }
      if (cancelled) return;

      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const ws = new WebSocket(
        `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(
          nicknameRef.current,
        )}&user_id=${encodeURIComponent(userIdRef.current)}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        userReadyRef.current = true;
      };

      ws.onclose = () => setConnected(false);

      ws.onmessage = (e) => {
        try {
          const msg: Message = JSON.parse(e.data);
          setMessages((prev) => [...prev, msg]);
        } catch (err) {
          console.error('메시지 파싱 에러:', err);
        }
      };

      ws.onerror = (e) => console.error('WebSocket 에러:', e);
    };

    connect();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [partyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!profileDrawer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileDrawer(null);
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
    )
      return;
    wsRef.current.send(input.trim());
    setInput('');
  }, [input]);

  const getMemberMeta = useCallback(
    (targetUserId?: string) => {
      const member = partyInfo?.members?.find(
        (m) => m.user_id === targetUserId,
      );
      if (!member)
        return {
          role: undefined,
          status: undefined,
          profile_image: null as string | null,
        };
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
      setProfileDrawer({ user: targetUser, top, left });
    },
    [],
  );

  const closeProfileDrawer = useCallback(() => setProfileDrawer(null), []);

  const handleProfileInfo = useCallback(() => {
    if (!profileDrawer) return;
    alert(
      `${profileDrawer.user.nickname ?? '사용자'} 프로필 정보를 여기에 연결하면 됩니다.`,
    );
    setProfileDrawer(null);
  }, [profileDrawer]);

  const handleReportUser = useCallback(() => {
    if (!profileDrawer) return;
    alert(
      `${profileDrawer.user.nickname ?? '사용자'} 신고 기능을 연결하면 됩니다.`,
    );
    setProfileDrawer(null);
  }, [profileDrawer]);

  const renderMessage = (msg: Message, i: number) => {
    const isMe = msg.user_id === userIdRef.current;
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
            className={`text-xs border px-3 py-1.5 rounded-xl ${isError ? 'text-red-600 bg-red-50 border-red-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}
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
                role: isMe ? user?.role : memberMeta.role,
                status: memberMeta.status,
              })
            }
          />
        </div>
        <div
          className={`flex flex-col gap-0.5 max-w-xs ${isMe ? 'items-end' : 'items-start'}`}
        >
          <p className="text-xs text-muted-foreground px-1">
            {msg.nickname ?? '익명'}
          </p>
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          partyId={partyId ?? ''}
          partyTitle={partyInfo?.title ?? '파티'}
          nickname={nicknameRef.current}
          monthlyPerPerson={partyInfo?.monthly_per_person ?? null}
          onPaymentComplete={() => {
            setAlreadyPaid(true);
            setShowPaymentModal(false);
          }}
        />
      )}

      {profileDrawer && (
        <ProfileDrawer
          user={profileDrawer.user}
          top={profileDrawer.top}
          left={profileDrawer.left}
          isMe={profileDrawer.user.user_id === userIdRef.current}
          onClose={closeProfileDrawer}
          onProfileInfo={handleProfileInfo}
          onReport={handleReportUser}
        />
      )}

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
          <p className="text-xs text-muted-foreground">정산요청 · 채팅 신고</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
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
                if (e.key === 'Enter' && !e.nativeEvent.isComposing)
                  sendMessage();
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
            {/* 결제 버튼 - 이번 달 결제 완료 시 비활성화 */}
            <button
              onClick={() => !alreadyPaid && setShowPaymentModal(true)}
              disabled={alreadyPaid}
              className={`flex-1 py-3 border-2 rounded-2xl text-sm font-bold transition
                ${
                  alreadyPaid
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-primary text-primary hover:bg-primary/5'
                }`}
            >
              {alreadyPaid ? '이번 달 결제 완료 ✓' : '정산요청'}
            </button>
          </div>
        </div>

        <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-border">
            <p className="text-sm font-bold text-foreground mb-3">파티 멤버</p>
            {Array.isArray(partyInfo?.members) &&
            partyInfo.members.length > 0 ? (
              <div className="flex flex-col gap-2">
                {partyInfo.members.map((member) => (
                  <MemberItem key={member.user_id} member={member} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                참여 중인 멤버 정보가 없습니다.
              </p>
            )}
          </div>

          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {partyInfo?.category_name && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    CATEGORY_COLOR[partyInfo.category_name] ??
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  {partyInfo.category_name}
                </span>
              )}
              {partyInfo?.status && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {PARTY_STATUS_LABEL[partyInfo.status] ?? partyInfo.status}
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-foreground mb-3">파티 정보</p>
            <div className="space-y-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <DetailRow
                label="서비스명"
                value={partyInfo?.service_name ?? '-'}
              />
              <DetailRow
                label="파티장"
                value={partyInfo?.host_nickname ?? '-'}
              />
              <DetailRow
                label="판매가"
                value={formatCurrency(partyInfo?.monthly_price)}
              />
              <DetailRow
                label="추천 할인"
                value={formatRate(partyInfo?.referral_discount_rate)}
              />
              <DetailRow
                label="1인 부담"
                value={formatCurrency(partyInfo?.monthly_per_person)}
                emphasized
              />
              <DetailRow
                label="인원"
                value={`${partyInfo?.member_count ?? '-'} / ${partyInfo?.max_members ?? '-'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
