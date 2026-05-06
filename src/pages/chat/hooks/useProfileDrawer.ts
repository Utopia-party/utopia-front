import { useEffect, useState, useCallback } from 'react';
import type {
  ProfileDrawerState,
  ProfileDrawerUser,
} from '../../../types/chat';
import { getPraiseAvailability } from '../../../apis/praises';

function getPraiseDisabledLabel(remainingDays?: number) {
  if (typeof remainingDays === 'number' && remainingDays > 0) {
    return `${remainingDays}일 뒤 다시 가능`;
  }
  return '30일 뒤 다시 가능';
}

interface UseProfileDrawerProps {
  currentUserId: string;
  partyId: string | undefined;
}

export function useProfileDrawer({
  currentUserId,
  partyId,
}: UseProfileDrawerProps) {
  const [profileDrawer, setProfileDrawer] = useState<ProfileDrawerState | null>(
    null,
  );
  const [profileInfoUser, setProfileInfoUser] =
    useState<ProfileDrawerUser | null>(null);
  const [praisedUserIds, setPraisedUserIds] = useState<Record<string, boolean>>(
    {},
  );
  const [praiseDisabledLabels, setPraiseDisabledLabels] = useState<
    Record<string, string>
  >({});

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

      const targetUserId = targetUser.user_id;
      if (!targetUserId || targetUserId === currentUserId) return;

      const targetUserIdText = String(targetUserId);

      void getPraiseAvailability(targetUserIdText, partyId)
        .then((data) => {
          if (!data.can_praise) {
            setPraisedUserIds((prev) => ({
              ...prev,
              [targetUserIdText]: true,
            }));
            setPraiseDisabledLabels((prev) => ({
              ...prev,
              [targetUserIdText]: getPraiseDisabledLabel(data.remaining_days),
            }));
            return;
          }
          setPraisedUserIds((prev) => {
            const next = { ...prev };
            delete next[targetUserIdText];
            return next;
          });
          setPraiseDisabledLabels((prev) => {
            const next = { ...prev };
            delete next[targetUserIdText];
            return next;
          });
        })
        .catch((err) => console.error('칭찬 가능 여부 조회 실패:', err));
    },
    [currentUserId, partyId],
  );

  const closeProfileDrawer = useCallback(() => setProfileDrawer(null), []);

  const handleProfileInfo = useCallback(() => {
    if (!profileDrawer) return;
    setProfileInfoUser(profileDrawer.user);
    setProfileDrawer(null);
  }, [profileDrawer]);

  const markPraised = useCallback(
    (userId: string, label = '30일 뒤 다시 가능') => {
      setPraisedUserIds((prev) => ({ ...prev, [userId]: true }));
      setPraiseDisabledLabels((prev) => ({ ...prev, [userId]: label }));
    },
    [],
  );

  return {
    profileDrawer,
    profileInfoUser,
    praisedUserIds,
    praiseDisabledLabels,
    openProfileDrawer,
    closeProfileDrawer,
    handleProfileInfo,
    setProfileDrawer,
    setProfileInfoUser,
    markPraised,
  };
}
