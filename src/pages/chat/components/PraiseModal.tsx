import { useMemo, useState } from 'react';
import { Heart, Sparkles, X } from 'lucide-react';
import type { ProfileDrawerUser } from '../../../types/chat';

type PraiseType =
  | 'kind'
  | 'fast_response'
  | 'responsible'
  | 'good_mood'
  | 'custom';

const PRAISE_OPTIONS: {
  type: PraiseType;
  label: string;
  description: string;
}[] = [
  {
    type: 'kind',
    label: '친절해요',
    description: '상대방을 배려하며 대화해요',
  },
  {
    type: 'fast_response',
    label: '응답이 빨라요',
    description: '필요할 때 빠르게 답변해줘요',
  },
  {
    type: 'responsible',
    label: '책임감 있어요',
    description: '파티 활동에 성실하게 참여해요',
  },
  {
    type: 'good_mood',
    label: '분위기를 좋게 해요',
    description: '채팅방 분위기를 따뜻하게 만들어요',
  },
];

export default function PraiseModal({
  targetUser,
  onClose,
  onSubmit,
}: {
  targetUser: ProfileDrawerUser | null;
  onClose: () => void;
  onSubmit: (payload: {
    praise_type: PraiseType;
    message: string | null;
  }) => Promise<void> | void;
}) {
  const [selectedType, setSelectedType] = useState<PraiseType | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return !!selectedType && !submitting;
  }, [selectedType, submitting]);

  if (!targetUser) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedType || submitting) return;

    try {
      setSubmitting(true);

      await onSubmit({
        praise_type: selectedType,
        message: message.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-110 flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 sm:h-12 sm:w-12">
              <Heart size={24} fill="currentColor" />
            </div>

            <h2 className="break-keep text-lg font-extrabold text-slate-900 sm:text-xl">
              {targetUser.nickname ?? '상대방'}님 칭찬하기
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="mb-3 text-sm font-bold text-slate-800">
            어떤 점을 칭찬할까요?
          </p>

          <div className="grid grid-cols-1 gap-2">
            {PRAISE_OPTIONS.map((option) => {
              const active = selectedType === option.type;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setSelectedType(option.type)}
                  className={`flex min-w-0 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                    active
                      ? 'border-pink-300 bg-pink-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Sparkles
                    size={17}
                    className={
                      active
                        ? 'mt-0.5 shrink-0 text-pink-500'
                        : 'mt-0.5 shrink-0 text-slate-400'
                    }
                  />

                  <span className="min-w-0">
                    <span
                      className={`block break-keep text-sm font-bold ${
                        active ? 'text-pink-700' : 'text-slate-800'
                      }`}
                    >
                      {option.label}
                    </span>

                    <span className="mt-0.5 block break-keep text-xs text-slate-500">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-800">
              메시지 남기기
              <span className="ml-1 font-medium text-slate-400">선택</span>
            </label>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={120}
              placeholder="따뜻한 한마디를 남겨보세요."
              className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:bg-white"
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {message.length}/120
            </div>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-100 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-2xl bg-pink-500 py-3 text-sm font-bold text-white transition hover:bg-pink-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? '보내는 중...' : '칭찬 보내기'}
          </button>
        </div>
      </div>
    </div>
  );
}
