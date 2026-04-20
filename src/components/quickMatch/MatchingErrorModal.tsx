type MatchingErrorModalProps = {
  open: boolean;
  message?: string;
  onClose: () => void;
  onRetry?: () => void;
};

export default function MatchingErrorModal({
  open,
  message = '조건에 맞는 파티를 찾지 못했어요.',
  onClose,
  onRetry,
}: MatchingErrorModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-3xl ring-1 ring-rose-100">
            😥
          </div>

          {/* 제목 */}
          <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
            아직 딱 맞는 파티를 찾지 못했어요
          </h3>

          {/* 에러 메시지 */}
          <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>

          {/* 보조 문구 */}
          <p className="mt-2 text-xs leading-5 text-slate-400">
            조건을 조금 바꾸거나, 잠시 후 다시 시도해보세요.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="mt-6 flex gap-2">
          {/* 둘러보기 */}
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            둘러보기
          </button>

          {/* 재시도 or 조건 수정 */}
          {onRetry ? (
            <button
              onClick={onRetry}
              className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              다시 시도
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
