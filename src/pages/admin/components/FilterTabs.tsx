interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function FilterTabs({
  tabs,
  activeTab,
  onTabChange,
}: FilterTabsProps) {
  return (
    // 💡 모바일 가로 스크롤 허용 및 스크롤바 숨김 처리
    <div className="flex gap-2 mb-5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      {tabs.map((tab) => (
        <button
          key={tab}
          // 💡 shrink-0 (버튼 찌그러짐 방지), whitespace-nowrap (글자 줄바꿈 방지) 추가
          className={`shrink-0 whitespace-nowrap px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold cursor-pointer transition-all active:scale-95 ${
            activeTab === tab
              ? 'bg-blue-500 text-white border border-blue-500 shadow-sm'
              : 'bg-white text-gray-500 border border-gray-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50'
          }`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
