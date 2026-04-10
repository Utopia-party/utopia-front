import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../apis/api';

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
  content: string;
  created_at: string;
}

interface Member {
  user_id: string;
  nickname: string;
  role: string;
  status: string;
}

interface PartyInfo {
  party_id: string;
  title: string;
  members: Member[];
}

// 결제 모달 관련 타입
type PaymentStep = 'select' | 'card' | 'transfer' | 'ocr';
type PaymentMethod = 'card' | 'transfer' | null;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const WS_BASE =
  import.meta.env.VITE_WS_BASE_URL ??
  API_BASE.replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace('/api', '');

// PortOne V2 테스트 Store ID (실제 값으로 교체 필요)
const PORTONE_STORE_ID = 'store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
// 사용할 채널 키 (포트원 콘솔 > 연동 정보 > 채널 관리에서 확인)
const PORTONE_CHANNEL_KEY = 'channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// 계좌 입금 테스트용 정보
const BANK_INFO = {
  bank: '카카오뱅크',
  account: '3333-01-1234567',
  holder: '홍길동(파티)',
};

const ROLE_LABEL: Record<string, string> = {
  leader: '리더',
  member: '멤버',
};

const STATUS_LABEL: Record<string, string> = {
  active: '정상',
  pending: '대기',
  banned: '정지',
};

// ────────────────────────────────────────────────
// 결제 모달 컴포넌트
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

  // PortOne SDK 동적 로드
  useEffect(() => {
    if (document.getElementById('portone-sdk')) return;
    const script = document.createElement('script');
    script.id = 'portone-sdk';
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // 카드 결제 요청
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
        totalAmount: 1, // 테스트: 1원
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: {
          fullName: nickname,
        },
      });

      if (response?.code) {
        // 결제 실패 or 취소
        alert(`결제 실패: ${response.message ?? '알 수 없는 오류'}`);
      } else {
        // 결제 성공
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

  // OCR 파일 선택
  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setOcrFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setOcrPreview(url);
    }
  };

  // OCR 인증 제출
  const handleOcrSubmit = () => {
    if (!ocrFile) {
      alert('파일을 선택해주세요.');
      return;
    }
    alert(`"${ocrFile.name}" OCR 인증 요청이 제출되었습니다!\nOCR 분석 → 자동 승인, 실패 시 관리자 검토`);
    onClose();
  };

  // 계좌번호 복사
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
        {/* 헤더 */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">정산 요청</h2>
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

          {/* STEP 1: 결제 수단 선택 */}
          {step === 'select' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 font-medium">결제 수단을 선택해주세요</p>

              <div className="grid grid-cols-2 gap-3">
                {/* 카드 결제 */}
                <button
                  onClick={() => { setMethod('card'); setStep('card'); }}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">카드 결제</p>
                    <p className="text-xs text-slate-400 mt-0.5">1원 테스트</p>
                  </div>
                </button>

                {/* 계좌 입금 */}
                <button
                  onClick={() => { setMethod('transfer'); setStep('transfer'); }}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <span className="text-2xl">🏦</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">계좌 입금</p>
                    <p className="text-xs text-slate-400 mt-0.5">OCR 인증</p>
                  </div>
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                결제 완료 후 영수증/이체확인서로 OCR 인증을 진행합니다
              </p>
            </div>
          )}

          {/* STEP 2-A: 카드 결제 */}
          {step === 'card' && (
            <div className="flex flex-col gap-5">
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">파티명</span>
                  <span className="font-semibold text-slate-800">{partyTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">결제자</span>
                  <span className="font-semibold text-slate-800">{nickname}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
                  <span className="text-slate-500">결제 금액</span>
                  <span className="font-extrabold text-primary text-base">1원 (테스트)</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">⚠️ 테스트 결제</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  포트원 테스트 환경에서 실제 결제는 발생하지 않습니다. 실제 카드 정보를 입력해도 청구되지 않습니다.
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
                  ) : '결제하기 💳'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2-B: 계좌 입금 안내 */}
          {step === 'transfer' && (
            <div className="flex flex-col gap-5">
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">입금 계좌 정보</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">은행</span>
                  <span className="font-semibold">{BANK_INFO.bank}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">계좌번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{BANK_INFO.account}</span>
                    <button
                      onClick={handleCopyAccount}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors"
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
                <p className="text-xs text-blue-700 font-medium">📋 입금 후 이체확인서 업로드 필요</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  입금 완료 후 아래 "다음" 버튼을 눌러 이체확인서를 OCR 인증해주세요.
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

          {/* STEP 3: OCR 인증 */}
          {step === 'ocr' && (
            <div className="flex flex-col gap-5">
              {paymentDone && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-green-500 text-lg">✅</span>
                  <div>
                    <p className="text-xs text-green-700 font-bold">결제 완료!</p>
                    {paymentId && (
                      <p className="text-xs text-green-600 font-mono mt-0.5">ID: {paymentId}</p>
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

                {/* 업로드 영역 */}
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
                      <p className="text-sm text-slate-500 font-medium">파일 선택 또는 드래그</p>
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
                    onClick={() => setStep(method === 'card' ? 'card' : 'transfer')}
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [nickname, setNickname] = useState('익명');
  const [userId, setUserId] = useState('guest');
  const [userReady, setUserReady] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // 결제 모달

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const connectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get('/api/me')
      .then(({ data }) => {
        if (data.is_logged_in && data.user) {
          setNickname(data.user.nickname);
          setUserId(data.user.user_id);
        }
        setUserReady(true);
      })
      .catch(() => {
        setUserReady(true);
      });
  }, []);

  useEffect(() => {
    if (!partyId) return;

    api
      .get(`/chat/parties/${partyId}/messages`)
      .then(({ data }) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('메시지 로딩 실패:', err);
        setMessages([]);
      });

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
    )
      return;

    connectedRef.current = true;

    const ws = new WebSocket(
      `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(nickname)}&user_id=${encodeURIComponent(userId)}`,
    );
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      connectedRef.current = false;
    };
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
      connectedRef.current = false;
    };
  }, [partyId, userReady, nickname, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
  };

  const handleReceiptSubmit = () => {
    if (!receiptFile) {
      alert('파일을 선택해주세요.');
      return;
    }
    alert(`"${receiptFile.name}" 인증 요청이 제출되었습니다.`);
  };

  const renderMessage = (msg: Message, i: number) => {
    const isMe = msg.nickname === nickname;

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
            className={`text-xs ${isError ? 'text-red-600 bg-red-50 border-red-200' : 'text-orange-600 bg-orange-50 border-orange-200'} border px-3 py-1.5 rounded-xl`}
          >
            {msg.content}
          </span>
        </div>
      );
    }

    return (
      <div
        key={i}
        className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}
      >
        {!isMe && (
          <p className="text-xs text-muted-foreground px-2">{msg.nickname}</p>
        )}
        <div
          className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}
        >
          {msg.content}
        </div>
        <p className="text-[10px] text-muted-foreground px-2">
          {msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 결제 모달 */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          partyTitle={partyInfo?.title ?? '파티'}
          nickname={nickname}
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
          <p className="text-xs text-muted-foreground">
            정산요청 · 영수증 인증 · 채팅 신고
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 pt-4 pb-1">
            <p className="text-sm font-bold text-foreground">메시지</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3 border border-border rounded-xl mx-5 mb-3 bg-white min-h-0">
            {Array.isArray(messages) && messages.length > 0 ? (
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
            {/* 정산 요청 → 결제 모달 오픈 */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 py-3 border-2 border-primary rounded-2xl text-sm font-bold text-primary hover:bg-primary/5"
            >
              정산 요청
            </button>
          </div>
        </div>

        <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-border">
            <p className="text-sm font-bold text-foreground mb-3">파티 멤버</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left pb-2">닉네임</th>
                  <th className="text-left pb-2">역할</th>
                  <th className="text-left pb-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(partyInfo?.members) &&
                  partyInfo.members.map((member) => (
                    <tr
                      key={member.user_id}
                      className="border-t border-border/50"
                    >
                      <td className="py-2.5 font-medium">{member.nickname}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {ROLE_LABEL[member.role] ?? member.role}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {STATUS_LABEL[member.status] ?? member.status}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="p-5">
            <p className="text-sm font-bold text-foreground mb-3">
              영수증 인증
            </p>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shrink-0"
              >
                파일 선택
              </button>
              <span className="text-xs text-muted-foreground truncate">
                {receiptFile ? receiptFile.name : '선택된 파일 없음'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleReceiptChange}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">
              OCR 분석 → 자동 승인 실패 시 관리자 검토
            </p>
            <button
              onClick={handleReceiptSubmit}
              className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold active:scale-[0.98]"
            >
              인증 요청
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
