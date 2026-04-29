export default function KeywordChips({
  keywords,
  isLoading,
  onPick,
}: {
  keywords: string[];
  isLoading: boolean;
  onPick: (keyword: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="mt-4 flex justify-center">
        <span className="text-xs text-white/50 animate-pulse">
          인기 검색어 분석 중...
        </span>
      </div>
    );
  }

  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-white/70">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
        </span>
        실시간 인기 검색
      </span>
      {keywords.map((keyword, index) => (
        <button
          key={`${keyword}-${index}`}
          onClick={() => onPick(keyword)}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <span className="mr-1.5 font-bold text-white/60">{index + 1}</span>
          {keyword}
        </button>
      ))}
    </div>
  );
}
