import { useEffect, useMemo, useState } from 'react';
import {
  Heart,
  Send,
  Inbox,
  RefreshCcw,
  MessageCircle,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMyPraises,
  deletePraise,
  type MyPraiseItem,
  type PraiseDirection,
} from '../../apis/praises';

const PRAISE_TYPE_LABEL: Record<string, string> = {
  kind: '친절해요',
  fast_response: '응답이 빨라요',
  responsible: '책임감 있어요',
  good_mood: '분위기를 좋게 해요',
  custom: '직접 칭찬',
};

const PRAISE_TYPE_DESCRIPTION: Record<string, string> = {
  kind: '상대방을 배려하며 대화했어요',
  fast_response: '필요할 때 빠르게 답변해줬어요',
  responsible: '파티 활동에 성실하게 참여했어요',
  good_mood: '채팅방 분위기를 따뜻하게 만들었어요',
  custom: '따뜻한 마음을 담아 칭찬했어요',
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitial(nickname?: string | null) {
  const value = nickname?.trim();

  if (!value) return '?';

  return value.slice(0, 1).toUpperCase();
}

function PraiseAvatar({
  nickname,
  profileImage,
}: {
  nickname?: string | null;
  profileImage?: string | null;
}) {
  const [imageError, setImageError] = useState(false);

  if (profileImage && !imageError) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary text-white">
        <img
          src={profileImage}
          alt={nickname ?? 'profile'}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
      {getInitial(nickname)}
    </div>
  );
}

function DeletePraiseModal({
  praise,
  direction,
  deleting,
  onClose,
  onConfirm,
}: {
  praise: MyPraiseItem | null;
  direction: PraiseDirection;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!praise) return null;

  const targetNickname =
    direction === 'received'
      ? (praise.from_nickname ?? '사용자')
      : (praise.to_nickname ?? '사용자');

  const relationText =
    direction === 'received'
      ? `${targetNickname}님에게 받은 칭찬`
      : `${targetNickname}님에게 보낸 칭찬`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900">
              칭찬 내역 삭제
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              이 내역은 내 칭찬 목록에서만 숨겨져요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">{relationText}</p>

            <div className="mt-2 flex items-center gap-2">
              <Heart size={16} className="text-pink-500" fill="currentColor" />
              <p className="text-sm text-slate-600">
                {PRAISE_TYPE_LABEL[praise.praise_type] ?? praise.praise_type}
              </p>
            </div>

            {praise.message && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                {praise.message}
              </p>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold leading-relaxed text-amber-700">
              삭제해도 이미 반영된 신뢰도 이력은 유지됩니다.
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PraiseCard({
  praise,
  direction,
  onDelete,
}: {
  praise: MyPraiseItem;
  direction: PraiseDirection;
  onDelete: (praise: MyPraiseItem) => void;
}) {
  const targetNickname =
    direction === 'received'
      ? (praise.from_nickname ?? '사용자')
      : (praise.to_nickname ?? '사용자');

  const targetProfileImage =
    direction === 'received'
      ? praise.from_profile_image
      : praise.to_profile_image;

  const relationLabel =
    direction === 'received' ? '나를 칭찬했어요' : '내가 칭찬했어요';

  const praiseLabel =
    PRAISE_TYPE_LABEL[praise.praise_type] ?? praise.praise_type;

  const praiseDescription =
    PRAISE_TYPE_DESCRIPTION[praise.praise_type] ?? '칭찬을 남겼어요';

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <PraiseAvatar
          nickname={targetNickname}
          profileImage={targetProfileImage}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-extrabold text-slate-900">
                  {targetNickname}
                </p>

                <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-600">
                  {relationLabel}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                {formatDateTime(praise.created_at)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDelete(praise)}
              className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              aria-label="칭찬 내역 삭제"
              title="삭제"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Heart size={17} className="text-pink-500" fill="currentColor" />
              <p className="text-sm font-extrabold text-slate-900">
                {praiseLabel}
              </p>
            </div>

            <p className="mt-1 text-sm text-slate-500">{praiseDescription}</p>

            {praise.message && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <MessageCircle size={14} />
                  메시지
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {praise.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ direction }: { direction: PraiseDirection }) {
  const isReceived = direction === 'received';

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {isReceived ? <Inbox size={28} /> : <Send size={28} />}
      </div>

      <p className="mt-5 text-base font-extrabold text-slate-900">
        {isReceived ? '아직 받은 칭찬이 없어요' : '아직 보낸 칭찬이 없어요'}
      </p>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        {isReceived
          ? '채팅방에서 다른 사용자가 나를 칭찬하면 이곳에서 확인할 수 있어요.'
          : '채팅방에서 상대방 프로필을 열고 칭찬을 보내면 이곳에 기록돼요.'}
      </p>
    </div>
  );
}

export default function MyPraises() {
  const [direction, setDirection] = useState<PraiseDirection>('received');
  const [items, setItems] = useState<MyPraiseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MyPraiseItem | null>(null);
  const [deletingPraiseId, setDeletingPraiseId] = useState<string | null>(null);

  const title = useMemo(() => {
    return direction === 'received' ? '받은 칭찬' : '보낸 칭찬';
  }, [direction]);

  const loadPraises = async (nextDirection = direction) => {
    try {
      setLoading(true);

      const data = await getMyPraises(nextDirection);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error('칭찬 내역 로딩 실패:', err);
      toast.error('칭찬 내역을 불러오지 못했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (praise: MyPraiseItem) => {
    if (deletingPraiseId) return;
    setDeleteTarget(praise);
  };

  const closeDeleteModal = () => {
    if (deletingPraiseId) return;
    setDeleteTarget(null);
  };

  const handleConfirmDeletePraise = async () => {
    if (!deleteTarget || deletingPraiseId) return;

    try {
      setDeletingPraiseId(deleteTarget.id);

      await deletePraise(deleteTarget.id);

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));

      toast.success('칭찬 내역을 삭제했어요.');
      setDeleteTarget(null);
    } catch (err) {
      console.error('칭찬 내역 삭제 실패:', err);
      toast.error('칭찬 내역을 삭제하지 못했습니다.');
    } finally {
      setDeletingPraiseId(null);
    }
  };

  useEffect(() => {
    void loadPraises(direction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8">
      <DeletePraiseModal
        praise={deleteTarget}
        direction={direction}
        deleting={!!deletingPraiseId}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeletePraise}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-3xl bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                <Heart size={24} fill="currentColor" />
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900">
                칭찬 내역
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                채팅방에서 주고받은 칭찬을 확인할 수 있어요.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadPraises()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              새로고침
            </button>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('received')}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                direction === 'received'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Inbox size={17} />
              받은 칭찬
            </button>

            <button
              type="button"
              onClick={() => setDirection('sent')}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                direction === 'sent'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Send size={17} />
              보낸 칭찬
            </button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-slate-900">{title}</p>
            <p className="text-xs font-semibold text-slate-400">
              총 {items.length.toLocaleString()}개
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-white">
              <div className="flex flex-col items-center gap-3">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
                <p className="text-sm font-semibold text-slate-500">
                  칭찬 내역을 불러오는 중입니다.
                </p>
              </div>
            </div>
          ) : items.length > 0 ? (
            <div className="flex flex-col gap-3">
              {items.map((praise) => (
                <PraiseCard
                  key={praise.id}
                  praise={praise}
                  direction={direction}
                  onDelete={openDeleteModal}
                />
              ))}
            </div>
          ) : (
            <EmptyState direction={direction} />
          )}
        </section>
      </div>
    </div>
  );
}
