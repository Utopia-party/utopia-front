import type { ReactNode } from 'react';

export type ManualSectionProps = {
  id: string;
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function ManualSection({
  id,
  number,
  title,
  description,
  children,
}: ManualSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
            STEP {number}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
