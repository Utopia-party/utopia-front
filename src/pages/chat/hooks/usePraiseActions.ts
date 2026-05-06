import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { ProfileDrawerUser } from '../../../types/chat';
import { createPraise } from '../../../apis/praises';

function getErrorStatus(err: unknown) {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { status?: unknown } }).response?.status ===
      'number'
  ) {
    return (err as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

interface UsePraiseActionsProps {
  partyId: string | undefined;
  currentUserId: string;
  praisedUserIds: Record<string, boolean>;
  onMarkPraised: (userId: string, label?: string) => void;
  onCloseDrawer: () => void;
}

export function usePraiseActions({
  partyId,
  currentUserId,
  praisedUserIds,
  onMarkPraised,
  onCloseDrawer,
}: UsePraiseActionsProps) {
  const [showPraiseModal, setShowPraiseModal] = useState(false);
  const [praiseTarget, setPraiseTarget] = useState<ProfileDrawerUser | null>(
    null,
  );

  const handlePraiseUser = useCallback(
    (drawerUser: ProfileDrawerUser | null) => {
      if (!drawerUser) return;
      const targetUserId = drawerUser.user_id;
      if (!targetUserId || targetUserId === currentUserId) return;

      const targetUserIdText = String(targetUserId);
      if (praisedUserIds[targetUserIdText]) {
        toast.error('이미 최근 30일 안에 칭찬한 사용자입니다.');
        onCloseDrawer();
        return;
      }
      setPraiseTarget(drawerUser);
      onCloseDrawer();
      setShowPraiseModal(true);
    },
    [currentUserId, praisedUserIds, onCloseDrawer],
  );

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

        onMarkPraised(targetUserId, '30일 뒤 다시 가능');
        setShowPraiseModal(false);
        setPraiseTarget(null);
        toast.success(`${targetNickname}님에게 칭찬을 보냈어요.`);
      } catch (err: unknown) {
        console.error('칭찬 실패:', err);
        const status = getErrorStatus(err);

        if (status === 409) {
          toast.error('이미 최근 30일 안에 칭찬한 사용자입니다.');
          onMarkPraised(targetUserId, '30일 뒤 다시 가능');
          setShowPraiseModal(false);
          setPraiseTarget(null);
          return;
        }

        if (status === 403) {
          toast.error('같은 파티의 활성 멤버에게만 칭찬할 수 있습니다.');
          setShowPraiseModal(false);
          setPraiseTarget(null);
          return;
        }

        toast.error('칭찬을 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    },
    [praiseTarget, partyId, onMarkPraised],
  );

  return {
    showPraiseModal,
    praiseTarget,
    setShowPraiseModal,
    setPraiseTarget,
    handlePraiseUser,
    handleSubmitPraise,
  };
}
