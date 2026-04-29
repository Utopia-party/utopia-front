import { useState } from 'react';
import { usePageTitle } from '../../../hooks/usePageTitle';

export default function SearchBar({
  onSearch,
}: {
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState('');
  const handleSearch = () => onSearch(value.trim());

  usePageTitle('');

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md transition focus-within:-translate-y-0.5 focus-within:shadow-white/10">
        <svg
          className="h-5 w-5 shrink-0 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="파티 검색 (예: Netflix, 쿠팡, Spotify, 밀리의서재...)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {value ? (
          <button
            className="rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => {
              setValue('');
              onSearch('');
            }}
          >
            ✕
          </button>
        ) : null}
        <button
          onClick={handleSearch}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          검색
        </button>
      </div>
    </div>
  );
}
