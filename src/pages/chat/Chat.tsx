import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../apis/api';

import type {
  PartyInfo,
  PartyNotice,
  ProfileDrawerUser,
  SettlementStatus,
} from '../../types/chat';
import ReportModal from './components/ReportModal';
import { PaymentModal } from './components/PaymentModal';
import { ProfileDrawer, ProfileInfoModal } from './components/ChatComponents';
import { MessageItem } from './components/MessageItem';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInputBar } from './components/ChatInputBar';
import PraiseModal from './components/PraiseModal';
import { NoticeBar } from './components/NoticeBar';
import { CredentialNoticeModal } from './components/CredentialNoticeModal';

import { useChatWebSocket } from './hooks/useChatWebSocket';
import { useProfileDrawer } from './hooks/useProfileDrawer';
import { usePraiseActions } from './hooks/usePraiseActions';

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
  const { user } = useAuthStore();

  const currentUserId = user?.user_id ?? 'guest';
  const currentNickname = user?.nickname ?? '익명';
  const myProfileImage = user?.profile_image ?? null;
  // 클로저 문제 방지용 ref
  const isLeaderRef = useRef(false);

  const [input, setInput] = useState('');
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<{
    amount: number;
    base_price: number;
    commission_rate: number;
    commission_amount: number;
    discount_reason?: string | null;
    pricing_type: 'normal' | 'quick_match';
    is_quick_match: boolean;
    quick_match_fee_rate: number;
  } | null>(null);

  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isPartyInfoOpen, setIsPartyInfoOpen] = useState(false);
  const [isRenamingPartyTitle, setIsRenamingPartyTitle] = useState(false);

  // 공지 & 정산
  const [notice, setNotice] = useState<PartyNotice | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [settlementStatus, setSettlementStatus] =
    useState<SettlementStatus | null>(null);
  const [isRequestingSettlement, setIsRequestingSettlement] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadPartyInfo = useCallback(async () => {
    if (!partyId) return;
    try {
      const { data } = await api.get(`/api/chat/parties/${partyId}/info`);
      setPartyInfo(data);
      isLeaderRef.current = data?.is_leader ?? false;
    } catch (err) {
      console.error('파티 정보 로딩 실패:', err);
      setPartyInfo(null);
    }
  }, [partyId]);

  const checkPaymentStatus = useCallback(async () => {
    if (!partyId) return;
    try {
      const { data } = await api.get(
        `/api/payments/status?party_id=${partyId}`,
      );
      setAlreadyPaid(data.paid);
    } catch (error) {
      console.error(error);
    }
  }, [partyId]);

  const { messages, unreadCounts, connected, sendMessage, initMessages } =
    useChatWebSocket({
      partyId,
      currentUserId,
      onPartyUpdated: loadPartyInfo,
      onNoticeUpdated: (n) => setNotice(n),
      onSettlementApproved: (settlementId) => {
        setSettlementStatus({
          status: 'approved',
          settlement_id: settlementId,
        });
        if (isLeaderRef.current) {
          setShowCredentialModal(true);
        } else {
          toast.success(
            '정산이 승인되었습니다. 방장이 곧 공유 정보를 올릴 예정이에요.',
          );
        }
      },
    });

  const {
    profileDrawer,
    profileInfoUser,
    praisedUserIds,
    praiseDisabledLabels,
    openProfileDrawer,
    closeProfileDrawer,
    handleProfileInfo,
    setProfileInfoUser,
    markPraised,
  } = useProfileDrawer({ currentUserId, partyId });

  const [reportTarget, setReportTarget] = useState<ProfileDrawerUser | null>(
    null,
  );

  const handleReportUser = useCallback(() => {
    if (!profileDrawer) return;
    setReportTarget(profileDrawer.user);
    closeProfileDrawer();
    setShowReportModal(true);
  }, [profileDrawer, closeProfileDrawer]);

  const {
    showPraiseModal,
    praiseTarget,
    setShowPraiseModal,
    setPraiseTarget,
    handlePraiseUser,
    handleSubmitPraise,
  } = usePraiseActions({
    partyId,
    currentUserId,
    praisedUserIds,
    onMarkPraised: markPraised,
    onCloseDrawer: closeProfileDrawer,
  });

  const handleKickUser = useCallback(async () => {
    if (!profileDrawer?.user.user_id || !partyId) return;
    const targetUserId = String(profileDrawer.user.user_id);
    const targetNickname = profileDrawer.user.nickname ?? '해당 멤버';
    if (!window.confirm(`${targetNickname}님을 파티에서 강퇴하시겠습니까?`))
      return;
    try {
      await api.delete(`/api/parties/${partyId}/members/${targetUserId}`);
      closeProfileDrawer();
      await loadPartyInfo();
      toast.success(`${targetNickname}님을 파티에서 강퇴했습니다.`);
    } catch (err) {
      console.error('멤버 강퇴 실패:', err);
      toast.error('멤버를 강퇴하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [loadPartyInfo, partyId, profileDrawer, closeProfileDrawer]);

  const handleRequestSettlement = useCallback(async () => {
    if (!partyId) return;
    if (
      !window.confirm(
        '정산 승인 요청을 보내시겠습니까?\n모든 멤버 결제 완료 시 자동 승인됩니다.',
      )
    )
      return;
    setIsRequestingSettlement(true);
    try {
      const { data } = await api.post(
        `/api/settlement/parties/${partyId}/request`,
      );
      if (data.status === 'approved') {
        setSettlementStatus({
          status: 'approved',
          settlement_id: data.settlement_id,
        });
        toast.success('정산 승인 완료! 아이디/비밀번호를 공유해주세요.');
        setShowCredentialModal(true);
      } else {
        setSettlementStatus({
          status: 'pending',
          settlement_id: data.settlement_id,
        });
        toast('미결제 멤버가 있어 관리자 검토 후 처리됩니다.', { icon: '⏳' });
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail ?? '정산 요청 중 오류가 발생했습니다.');
    } finally {
      setIsRequestingSettlement(false);
    }
  }, [partyId]);

  const handleRenamePartyTitle = useCallback(async () => {
    if (!partyId || !partyInfo?.is_leader) return;

    const currentTitle = partyInfo.title ?? '';
    const nextTitle = window
      .prompt('새 파티명을 입력하세요.', currentTitle)
      ?.trim();
    if (!nextTitle || nextTitle === currentTitle) return;

    try {
      setIsRenamingPartyTitle(true);
      await api.patch(`/api/parties/${partyId}/title`, { title: nextTitle });
      await loadPartyInfo();
      toast.success('파티명을 변경했습니다.');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail ?? '파티명 변경 중 오류가 발생했습니다.');
    } finally {
      setIsRenamingPartyTitle(false);
    }
  }, [partyId, partyInfo?.is_leader, partyInfo?.title, loadPartyInfo]);

  const getMemberMeta = useCallback(
    (targetUserId?: string) => {
      const member = partyInfo?.members?.find(
        (item) => item.user_id === targetUserId,
      );
      if (!member) {
        return {
          role: undefined,
          status: undefined,
          trust_score: undefined,
          joined_at: undefined,
          payment_status: null as 'completed' | 'pending' | null,
          profile_image: null as string | null,
        };
      }
      return {
        role: member.role,
        status: member.status,
        trust_score: member.trust_score ?? undefined,
        joined_at: member.joined_at ?? undefined,
        payment_status: member.payment_status ?? null,
        profile_image: member.profile_image ?? null,
      };
    },
    [partyInfo],
  );

  useEffect(() => {
    if (!partyId) return;

    api
      .get(`/api/chat/parties/${partyId}/messages`)
      .then(({ data }) => initMessages(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('메시지 로딩 실패:', err);
        initMessages([]);
      });

    api
      .get(`/api/chat/parties/${partyId}/info`)
      .then(({ data }) => {
        setPartyInfo(data);
        isLeaderRef.current = data?.is_leader ?? false;
      })
      .catch((err) => {
        console.error('파티 정보 로딩 실패:', err);
        setPartyInfo(null);
      });

    api
      .get(`/api/payments/preview?party_id=${partyId}`)
      .then(({ data }) => setPaymentPreview(data))
      .catch((err) => {
        console.error('빠른매칭 정산 금액 로딩 실패:', err);
        setPaymentPreview(null);
      });

    // 공지 로드
    api
      .get(`/api/settlement/parties/${partyId}/notice`)
      .then(({ data }) => setNotice(data.notice ?? null))
      .catch(() => setNotice(null));

    // 정산 상태 로드
    api
      .get(`/api/settlement/parties/${partyId}/status`)
      .then(({ data }) => setSettlementStatus(data))
      .catch(() => setSettlementStatus(null));

    const timer = window.setTimeout(() => void checkPaymentStatus(), 0);
    return () => window.clearTimeout(timer);
  }, [partyId, checkPaymentStatus, loadPartyInfo, initMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  }, [input, sendMessage]);

  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-background">
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          partyId={partyId ?? ''}
          partyTitle={partyInfo?.title ?? '파티'}
          nickname={currentNickname}
          monthlyPerPerson={partyInfo?.monthly_per_person ?? null}
          paymentPreviewAmount={paymentPreview?.amount ?? null}
          isQuickMatchPrice={paymentPreview?.is_quick_match ?? false}
          isLeader={partyInfo?.is_leader ?? false}
          hasReferrerDiscount={partyInfo?.has_referrer_discount ?? false}
          leaderDiscountRate={partyInfo?.leader_discount_rate ?? null}
          referralDiscountRate={partyInfo?.referral_discount_rate ?? null}
          onPaymentComplete={() => setAlreadyPaid(true)}
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

      {showCredentialModal && (
        <CredentialNoticeModal
          partyId={partyId ?? ''}
          existingContent={notice?.content ?? null}
          onClose={() => setShowCredentialModal(false)}
          onSaved={(content) => {
            if (content) {
              setNotice((prev) =>
                prev
                  ? { ...prev, content }
                  : { id: '', content, updated_at: new Date().toISOString() },
              );
            } else {
              setNotice(null);
            }
          }}
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
          onPraise={() => handlePraiseUser(profileDrawer.user)}
          praiseDisabled={
            !!profileDrawer.user.user_id &&
            !!praisedUserIds[String(profileDrawer.user.user_id)]
          }
          praiseDisabledLabel={
            profileDrawer.user.user_id
              ? (praiseDisabledLabels[String(profileDrawer.user.user_id)] ??
                '30일 뒤 다시 가능')
              : '30일 뒤 다시 가능'
          }
          onReport={handleReportUser}
          canKick={
            Boolean(partyInfo?.is_leader) &&
            profileDrawer.user.user_id !== currentUserId &&
            profileDrawer.user.role !== 'leader'
          }
          onKick={handleKickUser}
        />
      )}

      {profileInfoUser && (
        <ProfileInfoModal
          user={profileInfoUser}
          onClose={() => setProfileInfoUser(null)}
        />
      )}

      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-3 py-3 sm:px-5 md:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:text-sm"
        >
          ← 목록
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-extrabold text-foreground sm:text-base">
            {partyInfo?.title ?? '채팅방'}
          </h1>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            정산요청 · 채팅 신고
          </p>
        </div>

        {/* 방장 전용: 정산 승인 요청 버튼 */}
        {partyInfo?.is_leader && settlementStatus?.status == null && (
          <button
            type="button"
            onClick={handleRequestSettlement}
            disabled={isRequestingSettlement}
            className="shrink-0 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:opacity-50"
          >
            {isRequestingSettlement ? '처리중...' : '정산 승인 요청'}
          </button>
        )}

        {partyInfo?.is_leader && settlementStatus?.status === 'pending' && (
          <button
            type="button"
            disabled
            className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 opacity-90"
          >
            정산 요청 완료
          </button>
        )}

        {partyInfo?.is_leader && settlementStatus?.status === 'rejected' && (
          <button
            type="button"
            disabled
            className="shrink-0 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 opacity-90"
          >
            정산 거절됨
          </button>
        )}

        {/* 방장 전용: 승인 후 공지 등록/수정 버튼 */}
        {partyInfo?.is_leader && settlementStatus?.status === 'approved' && (
          <button
            type="button"
            onClick={() => setShowCredentialModal(true)}
            className="shrink-0 rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
          >
            {notice ? '공지 수정' : '공지 등록'}
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsPartyInfoOpen(true)}
          className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-muted lg:hidden"
        >
          파티 정보
        </button>
      </header>

      {/* 공지 고정 바 */}
      {notice && (
        <NoticeBar
          notice={notice}
          isLeader={partyInfo?.is_leader ?? false}
          onEdit={() => setShowCredentialModal(true)}
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 px-3 pt-3 pb-1 sm:px-5">
            <p className="text-sm font-bold text-foreground">메시지</p>
          </div>

          <div className="mx-3 mb-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-white px-3 py-3 sm:mx-5 sm:px-5">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <MessageItem
                  key={index}
                  msg={msg}
                  index={index}
                  currentUserId={currentUserId}
                  myProfileImage={myProfileImage}
                  unreadCounts={unreadCounts}
                  getMemberMeta={getMemberMeta}
                  onAvatarClick={openProfileDrawer}
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                [시스템] 채팅방이 생성되었습니다.
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          <ChatInputBar
            input={input}
            connected={connected}
            alreadyPaid={alreadyPaid}
            onChange={setInput}
            onSend={handleSend}
            onPaymentClick={() => setShowPaymentModal(true)}
          />
        </main>

        <div className="hidden w-80 shrink-0 border-l border-border lg:flex">
          <ChatSidebar
            partyInfo={partyInfo}
            paymentPreview={paymentPreview}
            onRenameTitle={
              isRenamingPartyTitle ? undefined : handleRenamePartyTitle
            }
            onMemberClick={openProfileDrawer}
          />
        </div>
      </div>

      {isPartyInfoOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsPartyInfoOpen(false)}
        >
          <div
            className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] max-w-full flex-col bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex w-full flex-1">
              <ChatSidebar
                partyInfo={partyInfo}
                paymentPreview={paymentPreview}
                onRenameTitle={
                  isRenamingPartyTitle ? undefined : handleRenamePartyTitle
                }
                onMemberClick={openProfileDrawer}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
