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
    <div className="flex gap-2 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition-all ${
            activeTab === tab
              ? 'bg-blue-500 text-white border border-blue-500'
              : 'bg-white text-gray-500 border border-gray-300 hover:border-blue-300 hover:text-blue-500'
          }`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
