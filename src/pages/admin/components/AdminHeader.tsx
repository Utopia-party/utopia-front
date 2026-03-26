import type { ReactNode } from 'react';

interface AdminHeaderProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  rightContent?: ReactNode;
}

export default function AdminHeader({
  placeholder = '검색...',
  onSearch,
  rightContent,
}: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-[480px]">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          className="border-none bg-transparent outline-none text-sm text-gray-500 w-full"
        />
      </div>
      <div className="flex items-center gap-4">
        {rightContent}
        <button className="px-3.5 py-1.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition">
          로그아웃(데모)
        </button>
      </div>
    </header>
  );
}
