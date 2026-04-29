import type { Category } from '../../../types/party';
import CategoryIconBadge from './CategoryIconBadge';

export default function CategorySidebar({
  categories,
  category,
  setCategory,
  onCreate,
  onQuickMatch,
}: {
  categories: Category[];
  category: string | null;
  setCategory: (value: string | null) => void;
  onCreate: () => void;
  onQuickMatch: () => void;
}) {
  return (
    <aside className="w-full shrink-0 md:w-64">
      <div className="sticky top-4 space-y-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Browse
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-slate-900">
              카테고리
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              원하는 서비스 유형만 빠르게 골라보세요.
            </p>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-2xl px-3 py-3 text-left text-sm transition ${category === null ? 'bg-slate-900 font-bold text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2">
                <CategoryIconBadge
                  name={null}
                  iconSize={15}
                  active={category === null}
                  className="h-8 w-8 shrink-0"
                />
                <span>전체 파티</span>
              </span>
            </button>
            {categories.map((cat: Category) => {
              const name = cat.name;
              const isActive = category === name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  className={`flex items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition ${isActive ? 'bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <CategoryIconBadge
                      name={name}
                      iconSize={15}
                      active={false}
                      className="h-8 w-8 shrink-0"
                    />
                    <span>{name}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={onCreate}
          className="w-full rounded-3xl bg-slate-900 px-4 py-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Create
              </p>
              <p className="mt-1 text-base font-extrabold">+ 파티 생성하기 </p>
              <p className="mt-1 text-sm text-white/70">
                직접 모집글을 올리고 멤버를 모아보세요.
              </p>
            </div>
            <span className="text-2xl">🍿</span>
          </div>
        </button>

        <button
          onClick={onQuickMatch}
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Quick match
              </p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                빠른 매칭
              </p>
              <p className="mt-1 text-sm text-slate-500">
                조건만 입력하면 맞는 파티를 더 빠르게 찾아드려요.
              </p>
              <p className="mt-1 text-xs text-amber-600">
                * 빠른 매칭 이용 시 수수료가 부과됩니다.
              </p>
            </div>
            <span className="text-2xl">⚡️</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
