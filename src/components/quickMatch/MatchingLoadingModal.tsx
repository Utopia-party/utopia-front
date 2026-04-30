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
      <div
        // 모바일에서는 모서리 둥글기와 여백을 살짝 줄여서 화면 비율에 맞춤
        className="w-full max-w-sm rounded-2xl sm:rounded-[28px] bg-white px-5 py-6 sm:px-6 sm:py-8 text-center shadow-2xl"
      >
        {/* 아이콘 */}
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-indigo-50 text-2xl sm:text-3xl ring-1 ring-indigo-100">
          ⚡️
        </div>

        {/* 제목 */}
        <h3 className="mt-3 sm:mt-4 break-keep text-lg sm:text-xl font-extrabold text-slate-900">
          빠른 매칭 중이에요
        </h3>

        {/* 설명 */}
        <p className="mt-2 sm:mt-3 break-keep text-xs sm:text-sm leading-relaxed sm:leading-6 text-slate-500">
          {message}
        </p>

        {/* 로딩 애니메이션 (모바일에서 너무 커 보이지 않게 크기 살짝 조정) */}
        <div className="mt-5 sm:mt-6 flex items-center justify-center gap-1.5 sm:gap-2">
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.2s]" />
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.1s]" />
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 animate-bounce rounded-full bg-indigo-500" />
        </div>

        {/* 하단 안내 */}
        <p className="mt-5 sm:mt-6 break-keep text-[10px] sm:text-xs leading-relaxed sm:leading-5 text-slate-400">
          조건에 맞는 파티를 찾으면 바로 참여까지 연결해드릴게요.
        </p>
      </div>
    </div>
  );
}
