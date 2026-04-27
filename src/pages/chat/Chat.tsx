import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../apis/api';

import type {
  Message,
  PartyInfo,
  ProfileDrawerState,
  ProfileDrawerUser,
} from '../../types/chat';
import ReportModal from './components/ReportModal';
import { PaymentModal } from './components/PaymentModal';
import {
  Avatar,
  ProfileDrawer,
  DetailRow,
  MemberItem,
} from './components/ChatComponents';
import {
  WS_BASE,
  CATEGORY_COLOR,
  PARTY_STATUS_LABEL,
  formatCurrency,
  formatRate,
} from './ChatConstants';
import PraiseModal from './components/PraiseModal';
import { createPraise } from '../../apis/praises';

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

export default function Chat() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [profileDrawer, setProfileDrawer] = useState<ProfileDrawerState | null>(
    null,
  );
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<ProfileDrawerUser | null>(
    null,
  );

  const [showPraiseModal, setShowPraiseModal] = useState(false);
  const [praiseTarget, setPraiseTarget] = useState<ProfileDrawerUser | null>(
    null,
  );

  const [praisedUserIds, setPraisedUserIds] = useState<Record<string, boolean>>(
    {},
  );

  const nicknameRef = useRef(user?.nickname ?? '익명');
  const myProfileImage = user?.profile_image ?? null;
  const currentNickname = user?.nickname ?? '익명';
  const currentUserId = user?.user_id ?? 'guest';

  useEffect(() => {
    if (user?.nickname) nicknameRef.current = user.nickname;
  }, [user]);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userReadyRef = useRef(false);

  const checkPaymentStatus = useCallback(async () => {
    if (!partyId) return;
    try {
      const { data } = await api.get(
        `/api/payments/status?party_id=${partyId}`,
      );
      setAlreadyPaid(data.paid);
    } catch (e) {
      console.error(e);
    }
  }, [partyId]);

  useEffect(() => {
    if (!partyId) return;
    api
      .get(`/api/chat/parties/${partyId}/messages`)
      .then(({ data }) => setMessages(Array.isArray(data) ? data : []))
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
    const t = window.setTimeout(() => {
      void checkPaymentStatus();
    }, 0);
    return () => {
      window.clearTimeout(t);
    };
  }, [partyId, checkPaymentStatus]);

  useEffect(() => {
    if (!partyId) return;
    let cancelled = false;
    const connect = async () => {
      if (!userReadyRef.current) await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      )
        return;
      const ws = new WebSocket(
        `${WS_BASE}/api/chat/ws/${partyId}?nickname=${encodeURIComponent(nicknameRef.current)}`,
      );
      wsRef.current = ws;
      ws.onopen = () => {
        setConnected(true);
        userReadyRef.current = true;
      };
      ws.onclose = () => setConnected(false);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'message_deleted') {
            setMessages((prev) =>
              prev.filter((m) => m.content !== msg.content),
            );
            return;
          }
          if (msg.type === 'force_logout') {
            wsRef.current?.close();
            wsRef.current = null;
            logout().then(() => navigate('/login?reason=banned'));
            return;
          }
          setMessages((prev) => [...prev, msg as Message]);
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
  }, [partyId, logout, navigate]);

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
    (e: React.MouseEvent<HTMLElement>, targetUser: ProfileDrawerUser) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const drawerWidth = 280;
      const drawerHeight = 270;
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

    toast('프로필 정보 기능은 준비 중입니다.', {
      icon: '👤',
    });

    setProfileDrawer(null);
  }, [profileDrawer]);
  const handleReportUser = useCallback(() => {
    if (!profileDrawer) return;
    setReportTarget(profileDrawer.user);
    setProfileDrawer(null);
    setShowReportModal(true);
  }, [profileDrawer]);

  const handlePraiseUser = useCallback(() => {
    if (!profileDrawer) return;

    const targetUserId = profileDrawer.user.user_id;

    if (!targetUserId || targetUserId === currentUserId) return;

    if (praisedUserIds[targetUserId]) {
      toast.error('이미 최근 30일 안에 칭찬한 사용자입니다.');
      setProfileDrawer(null);
      return;
    }

    setPraiseTarget(profileDrawer.user);
    setProfileDrawer(null);
    setShowPraiseModal(true);
  }, [profileDrawer, currentUserId, praisedUserIds]);

  const handleSubmitPraise = useCallback(
    async ({
      praise_type,
      message,
    }: {
      praise_type: Parameters<typeof createPraise>[0]['praise_type'];
      message: string | null;
    }) => {
      if (!praiseTarget?.user_id) return;

      const targetUserId = String(praiseTarget.user_id);
      const targetNickname = praiseTarget.nickname ?? '상대방';

      try {
        await createPraise({
          party_id: partyId,
          to_user_id: targetUserId,
          praise_type,
          message,
        });

        setPraisedUserIds((prev) => ({
          ...prev,
          [targetUserId]: true,
        }));

        setShowPraiseModal(false);
        setPraiseTarget(null);

        toast.success(`${targetNickname}님에게 칭찬을 보냈어요.`);
      } catch (err: unknown) {
        console.error('칭찬 실패:', err);

        const status =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { status?: unknown } }).response
            ?.status === 'number'
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 409) {
          toast.error('이미 최근 30일 안에 칭찬한 사용자입니다.');

          setPraisedUserIds((prev) => ({
            ...prev,
            [targetUserId]: true,
          }));

          setShowPraiseModal(false);
          setPraiseTarget(null);
          return;
        }

        toast.error('칭찬을 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    },
    [praiseTarget, partyId],
  );

  const renderMessage = useCallback(
    (msg: Message, i: number, currentUserId: string) => {
      const isMe = msg.user_id === currentUserId;
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
          className={`flex ${isMe ? 'justify-end' : 'justify-start gap-2'}`}
        >
          {!isMe && (
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
          )}
          <div
            className={`flex flex-col gap-0.5 max-w-xs ${isMe ? 'items-end' : 'items-start'}`}
          >
            {!isMe && (
              <p className="text-xs text-muted-foreground px-1">
                {msg.nickname ?? '익명'}
              </p>
            )}
            <div
              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}
            >
              {msg.content}
            </div>
            <p className="text-[10px] text-muted-foreground px-1">
              {(() => {
                if (!msg.created_at) return '';
                const raw =
                  msg.created_at.endsWith('Z') || msg.created_at.includes('+')
                    ? msg.created_at
                    : msg.created_at.replace(' ', 'T') + 'Z';
                const d = new Date(raw);
                if (isNaN(d.getTime())) return '';
                return d.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              })()}
            </p>
          </div>
        </div>
      );
    },
    [getMemberMeta, openProfileDrawer, myProfileImage],
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          partyId={partyId ?? ''}
          partyTitle={partyInfo?.title ?? '파티'}
          nickname={currentNickname}
          monthlyPerPerson={partyInfo?.monthly_per_person ?? null}
          isLeader={partyInfo?.is_leader ?? false}
          hasReferrerDiscount={partyInfo?.has_referrer_discount ?? false}
          leaderDiscountRate={partyInfo?.leader_discount_rate ?? null}
          referralDiscountRate={partyInfo?.referral_discount_rate ?? null}
          onPaymentComplete={() => {
            setAlreadyPaid(true);
            setShowPaymentModal(false);
          }}
        />
      )}
      {showReportModal && (
        <ReportModal
          targetUser={reportTarget}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
          onSuccess={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
        />
      )}

      {showPraiseModal && (
        <PraiseModal
          targetUser={praiseTarget}
          onClose={() => {
            setShowPraiseModal(false);
            setPraiseTarget(null);
          }}
          onSubmit={handleSubmitPraise}
        />
      )}

      {profileDrawer && (
        <ProfileDrawer
          user={profileDrawer.user}
          top={profileDrawer.top}
          left={profileDrawer.left}
          isMe={profileDrawer.user.user_id === currentUserId}
          onClose={closeProfileDrawer}
          onProfileInfo={handleProfileInfo}
          onPraise={handlePraiseUser}
          praiseDisabled={
            !!profileDrawer.user.user_id &&
            !!praisedUserIds[profileDrawer.user.user_id]
          }
          praiseDisabledLabel="30일 뒤 다시 가능"
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
              messages.map((msg, i) => renderMessage(msg, i, currentUserId))
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
          <div className="mx-5 mb-4">
            <button
              onClick={() => !alreadyPaid && setShowPaymentModal(true)}
              disabled={alreadyPaid}
              className={`w-full py-3 border-2 rounded-2xl text-sm font-bold transition ${
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
                  <MemberItem
                    key={member.user_id}
                    member={member}
                    onClick={(e) =>
                      openProfileDrawer(e, {
                        user_id: member.user_id,
                        nickname: member.nickname,
                        profile_image: member.profile_image ?? null,
                        role: member.role,
                        status: member.status,
                      })
                    }
                  />
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
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${CATEGORY_COLOR[partyInfo.category_name] ?? 'bg-slate-100 text-slate-600'}`}
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
