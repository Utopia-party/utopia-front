import type { Message } from '../../../types/chat';
import { Avatar } from './ChatComponents';
import type { ProfileDrawerUser } from '../../../types/chat';

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
    e: React.MouseEvent<HTMLElement>,
    user: ProfileDrawerUser,
  ) => void;
}

function formatMessageTime(createdAt?: string): string {
  if (!createdAt) return '';
  const raw =
    createdAt.endsWith('Z') || createdAt.includes('+')
      ? createdAt
      : createdAt.replace(' ', 'T') + 'Z';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
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
      <div key={index} className="flex justify-center">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.type === 'system_info') {
    return (
      <div key={index} className="flex justify-center">
        <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.type === 'warning' || msg.type === 'error') {
    const isError = msg.type === 'error';
    return (
      <div key={index} className="flex justify-center">
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
      className={`flex ${isMe ? 'justify-end' : 'justify-start gap-2'}`}
    >
      {!isMe && (
        <div className="shrink-0 mt-1">
          <Avatar
            nickname={msg.nickname}
            profileImage={senderImage}
            size="sm"
            onClick={(e) =>
              onAvatarClick(e, {
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
        className={`flex flex-col gap-0.5 max-w-xs ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {!isMe && (
          <p className="text-xs text-muted-foreground px-1">
            {msg.nickname ?? '익명'}
          </p>
        )}

        <div
          className={`flex items-end gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isMe
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border text-foreground rounded-bl-sm'
            }`}
          >
            {msg.content}
          </div>

          <div
            className={`flex flex-col shrink-0 gap-0.5 ${
              isMe ? 'items-end' : 'items-start'
            }`}
          >
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-primary leading-none">
                {unreadCount}
              </span>
            )}
            <p className="text-[10px] text-muted-foreground">
              {formatMessageTime(msg.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
