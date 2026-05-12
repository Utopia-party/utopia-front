import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export type ManualSectionProps = {
  id: string;
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function ManualSection({
  id,
  number,
  title,
  description,
  children,
  defaultOpen = false,
}: ManualSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* 헤더 — 클릭으로 토글 */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-5 sm:px-7 sm:py-6 text-left transition hover:bg-slate-50/60"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
            STEP {number}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl truncate">
              {title}
            </h2>
            {description && !isOpen && (
              <p className="mt-0.5 text-xs text-slate-400 truncate max-w-xl">
                {description}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          className={`shrink-0 h-5 w-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 본문 — 열렸을 때만 렌더 */}
      {isOpen && (
        <div className="border-t border-slate-100 px-5 pb-6 pt-5 sm:px-7 sm:pb-8">
          {description && (
            <p className="mb-6 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}
