import type { Message, ProfileDrawerUser } from '../../../types/chat';
import { Avatar } from './ChatComponents';

interface MessageItemProps {
  msg: Message;
  index: number;
  currentUserId: string;
  myProfileImage: string | null;
  unreadCounts: Record<string, number>;
  getMemberMeta: (userId?: string) => {
    role: string | undefined;
    status: string | undefined;
    trust_score: number | undefined;
    joined_at: string | undefined;
    payment_status: 'completed' | 'pending' | null;
    profile_image: string | null;
  };
  onAvatarClick: (
    event: React.MouseEvent<HTMLElement>,
    user: ProfileDrawerUser,
  ) => void;
}

function formatMessageTime(createdAt?: string): string {
  if (!createdAt) return '';

  const raw =
    createdAt.endsWith('Z') || createdAt.includes('+')
      ? createdAt
      : createdAt.replace(' ', 'T') + 'Z';

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageItem({
  msg,
  index,
  currentUserId,
  myProfileImage,
  unreadCounts,
  getMemberMeta,
  onAvatarClick,
}: MessageItemProps) {
  if (msg.type === 'system') {
    return (
      <div key={index} className="flex justify-center px-2">
        <span className="max-w-full wrap-break-word rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.type === 'system_info') {
    return (
      <div key={index} className="flex justify-center px-2">
        <span className="max-w-full wrap-break-word rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-center text-xs text-blue-600">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.type === 'warning' || msg.type === 'error') {
    const isError = msg.type === 'error';

    return (
      <div key={index} className="flex justify-center px-2">
        <span
          className={`max-w-full wrap-break-word rounded-xl border px-3 py-1.5 text-center text-xs ${
            isError
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-orange-200 bg-orange-50 text-orange-600'
          }`}
        >
          {msg.content}
        </span>
      </div>
    );
  }

  const isMe = msg.user_id === currentUserId;
  const memberMeta = getMemberMeta(msg.user_id);

  const senderImage = isMe
    ? myProfileImage
    : (msg.profile_image ?? memberMeta.profile_image ?? null);

  const unreadCount = msg.chat_id
    ? (unreadCounts[msg.chat_id] ?? msg.unread_count ?? 0)
    : (msg.unread_count ?? 0);

  return (
    <div
      key={index}
      className={`flex w-full min-w-0 ${
        isMe ? 'justify-end' : 'justify-start gap-2'
      }`}
    >
      {!isMe && (
        <div className="mt-1 shrink-0">
          <Avatar
            nickname={msg.nickname}
            profileImage={senderImage}
            size="sm"
            onClick={(event) =>
              onAvatarClick(event, {
                user_id: msg.user_id,
                nickname: msg.nickname,
                profile_image: senderImage,
                role: memberMeta.role,
                status: memberMeta.status,
                trust_score: memberMeta.trust_score,
                joined_at: memberMeta.joined_at,
                payment_status: memberMeta.payment_status,
              })
            }
          />
        </div>
      )}

      <div
        className={`flex min-w-0 max-w-[min(78vw,460px)] flex-col gap-0.5 sm:max-w-[min(68vw,520px)] ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {!isMe && (
          <p className="max-w-full truncate px-1 text-xs text-muted-foreground">
            {msg.nickname ?? '익명'}
          </p>
        )}

        <div
          className={`flex max-w-full items-end gap-1 ${
            isMe ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <div
            className={`max-w-full wrap-anywhere rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isMe
                ? 'rounded-br-sm bg-primary text-primary-foreground'
                : 'rounded-bl-sm border border-border bg-card text-foreground'
            }`}
          >
            {msg.content}
          </div>

          <div
            className={`flex shrink-0 flex-col gap-0.5 ${
              isMe ? 'items-end' : 'items-start'
            }`}
          >
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold leading-none text-primary">
                {unreadCount}
              </span>
            )}

            <p className="whitespace-nowrap text-[10px] text-muted-foreground">
              {formatMessageTime(msg.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
