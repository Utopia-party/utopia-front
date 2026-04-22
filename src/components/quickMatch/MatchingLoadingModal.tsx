type MatchingLoadingModalProps = {
  open: boolean;
  message?: string;
};

export default function MatchingLoadingModal({
  open,
  message = '조건에 맞는 파티를 찾고 있어요',
}: MatchingLoadingModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] bg-white px-6 py-8 text-center shadow-2xl">
        {/* 아이콘 */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl ring-1 ring-indigo-100">
          🥷
        </div>

        {/* 제목 */}
        <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
          빠른 매칭 중이에요
        </h3>

        {/* 설명 */}
        <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>

        {/* 로딩 애니메이션 */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.2s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.1s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500" />
        </div>

        {/* 하단 안내 */}
        <p className="mt-6 text-xs leading-5 text-slate-400">
          조건에 맞는 파티를 찾으면 바로 참여까지 연결해드릴게요.
        </p>
      </div>
    </div>
  );
}
