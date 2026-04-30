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
    // 모바일: 가로 스크롤(overflow-x-auto, 스크롤바 숨김) / PC(sm 이상): 줄바꿈(flex-wrap) 및 중앙 정렬
    <div className="mt-4 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      {/* shrink-0을 주어 가로 스크롤 시 텍스트가 찌그러지지 않게 방지합니다 */}
      <span className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-white/70">
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
          // shrink-0 추가, PC 화면에서는 터치 영역을 조금 더 넓게(sm:px-4 sm:py-2) 조정
          // 터치할 때 앱처럼 살짝 눌리는 효과(active:scale-95) 추가
          className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
        >
          <span className="mr-1.5 font-bold text-white/60">{index + 1}</span>
          {keyword}
        </button>
      ))}
    </div>
  );
}
