import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchLatestNotifications,
  notificationKeys,
} from '../../apis/notifications';
import type { NotificationItem } from '../../types/notifications';

export default function SystemNoticeBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: notices = [] } = useQuery<NotificationItem[]>({
    queryKey: notificationKeys.latest,
    queryFn: fetchLatestNotifications,
    enabled: !dismissed,
  });

  const activeNotice = !dismissed && notices.length > 0 ? notices[0] : null;

  if (!activeNotice) return null;

  const badgeText = activeNotice.type || '공지';
  const titleText = activeNotice.title || '';
  const bodyText = activeNotice.message || '';

  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3.5">
      <span className="shrink-0 text-lg">📢</span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-blue-800">{badgeText}</p>

        {titleText && (
          <p className="mt-0.5 text-sm font-semibold text-blue-700">
            {titleText}
          </p>
        )}

        {bodyText && (
          <p className="mt-1 whitespace-pre-line text-xs text-blue-600">
            {bodyText}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-blue-400 hover:text-blue-600"
        aria-label="공지 닫기"
      >
        ✕
      </button>
    </div>
  );
}
