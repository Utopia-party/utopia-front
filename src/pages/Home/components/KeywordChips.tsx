export default function KeywordChips({
  keywords,
  isLoading,
  onPick,
}: {
  keywords: string[];
  isLoading: boolean;
  onPick: (keyword: string) => void;
}) {
  const normalizedKeywords = keywords
    .map((keyword) => keyword.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="mt-4 flex justify-center">
        <span className="text-xs text-white/50 animate-pulse">
          인기 검색어 분석 중...
        </span>
      </div>
    );
  }

  if (normalizedKeywords.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-4 flex w-full max-w-4xl min-w-0 items-center gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-white/70">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        실시간 인기 검색
      </span>

      {normalizedKeywords.map((keyword, index) => (
        <button
          key={`${keyword}-${index}`}
          type="button"
          title={keyword}
          aria-label={`${index + 1}위 인기 검색어 ${keyword}`}
          onClick={() => onPick(keyword)}
          className="flex max-w-[72vw] shrink-0 items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95 sm:max-w-55 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span className="mr-1.5 shrink-0 font-bold text-white/60">
            {index + 1}
          </span>

          <span className="min-w-0 truncate">{keyword}</span>
        </button>
      ))}
    </div>
  );
}
