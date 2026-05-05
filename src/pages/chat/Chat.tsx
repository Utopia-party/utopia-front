import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../apis/api';

import type { PartyInfo, ProfileDrawerUser } from '../../types/chat';
import ReportModal from './components/ReportModal';
import { PaymentModal } from './components/PaymentModal';
import { ProfileDrawer, ProfileInfoModal } from './components/ChatComponents';
import { MessageItem } from './components/MessageItem';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInputBar } from './components/ChatInputBar';
import PraiseModal from './components/PraiseModal';

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

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadPartyInfo = useCallback(async () => {
    if (!partyId) return;
    try {
      const { data } = await api.get(`/api/chat/parties/${partyId}/info`);
      setPartyInfo(data);
    } catch (err) {
      console.error('파티 정보 로딩 실패:', err);
      setPartyInfo(null);
    }
  }, [partyId]);

  const checkPaymentStatus = useCallback(async () => {
    if (!partyId) return;
    try {
      const { data } = await api.get(`/api/payments/status?party_id=${partyId}`);
      setAlreadyPaid(data.paid);
    } catch (e) {
      console.error(e);
    }
  }, [partyId]);

  const { messages, unreadCounts, connected, sendMessage, initMessages } =
    useChatWebSocket({ partyId, currentUserId, onPartyUpdated: loadPartyInfo });

  const {
    profileDrawer,
    profileInfoUser,
    praisedUserIds,
    praiseDisabledLabels,
    openProfileDrawer,
    closeProfileDrawer,
    handleProfileInfo,
    setProfileDrawer: _setProfileDrawer,
    setProfileInfoUser,
    markPraised,
  } = useProfileDrawer({ currentUserId, partyId });

  const [reportTarget, setReportTarget] = useState<ProfileDrawerUser | null>(null);

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
    if (!window.confirm(`${targetNickname}님을 파티에서 강퇴하시겠습니까?`)) return;
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

  const getMemberMeta = useCallback(
    (targetUserId?: string) => {
      const member = partyInfo?.members?.find((m) => m.user_id === targetUserId);
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
      .catch((err) => { console.error('메시지 로딩 실패:', err); initMessages([]); });
    void loadPartyInfo();
    api
      .get(`/api/payments/preview?party_id=${partyId}`)
      .then(({ data }) => setPaymentPreview(data))
      .catch((err) => { console.error('빠른매칭 정산 금액 로딩 실패:', err); setPaymentPreview(null); });
    const t = window.setTimeout(() => void checkPaymentStatus(), 0);
    return () => window.clearTimeout(t);
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
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
          onClose={() => { setShowReportModal(false); setReportTarget(null); }}
          onSuccess={() => { setShowReportModal(false); setReportTarget(null); }}
        />
      )}

      {showPraiseModal && (
        <PraiseModal
          targetUser={praiseTarget}
          onClose={() => { setShowPraiseModal(false); setPraiseTarget(null); }}
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
          onPraise={() => handlePraiseUser(profileDrawer.user)}
          praiseDisabled={
            !!profileDrawer.user.user_id &&
            !!praisedUserIds[String(profileDrawer.user.user_id)]
          }
          praiseDisabledLabel={
            profileDrawer.user.user_id
              ? (praiseDisabledLabels[String(profileDrawer.user.user_id)] ?? '30일 뒤 다시 가능')
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

      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
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
              messages.map((msg, i) => (
                <MessageItem
                  key={i}
                  msg={msg}
                  index={i}
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
        </div>

        <ChatSidebar
          partyInfo={partyInfo}
          paymentPreview={paymentPreview}
          onMemberClick={openProfileDrawer}
        />
      </div>
    </div>
  );
}
