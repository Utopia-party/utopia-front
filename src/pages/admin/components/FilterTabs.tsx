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
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
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
