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
      {/* 모바일에서는 컴팩트한 간격(gap-3), 데스크탑에서는 넓은 간격(gap-4) */}
      <div className="sticky top-4 flex flex-col gap-3 md:gap-4">
        <div className="overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* 💡 모바일에서는 타이틀 영역 숨김, 공간 절약 */}
          <div className="hidden border-b border-slate-100 px-4 py-4 md:block">
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

          {/* 💡 모바일: 가로 스크롤(flex-row, overflow-x-auto), PC: 세로 리스트(md:flex-col) */}
          <nav className="flex flex-row gap-2 p-2 overflow-x-auto md:flex-col md:gap-1 md:p-3 md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <button
              onClick={() => setCategory(null)}
              className={`shrink-0 rounded-xl md:rounded-2xl px-3 py-2 md:py-3 text-left text-sm transition ${
                category === null
                  ? 'bg-slate-900 font-bold text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 md:bg-transparent md:hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <CategoryIconBadge
                  name={null}
                  iconSize={15}
                  active={category === null}
                  // 모바일에서는 뱃지 크기를 살짝 줄임
                  className="h-7 w-7 md:h-8 md:w-8 shrink-0"
                />
                <span className="whitespace-nowrap">전체 파티</span>
              </span>
            </button>

            {categories.map((cat: Category) => {
              const name = cat.name;
              const isActive = category === name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  className={`shrink-0 flex items-center justify-between rounded-xl md:rounded-2xl px-3 py-2 md:py-3 text-left text-sm transition ${
                    isActive
                      ? 'bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-100'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 md:bg-transparent md:hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CategoryIconBadge
                      name={name}
                      iconSize={15}
                      active={false}
                      className="h-7 w-7 md:h-8 md:w-8 shrink-0"
                    />
                    <span className="whitespace-nowrap">{name}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 💡 액션 버튼 그룹: 모바일 가로 좁은 모드일땐 세로, 태블릿(sm)일 땐 나란히, PC(md)일 땐 다시 세로 배치 */}
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:gap-4">
          <button
            onClick={onCreate}
            className="flex-1 rounded-2xl md:rounded-3xl bg-slate-900 p-4 md:px-4 md:py-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95 md:active:scale-100"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="hidden text-xs font-bold uppercase tracking-[0.2em] text-white/60 md:block">
                  Create
                </p>
                <p className="text-sm md:mt-1 md:text-base font-extrabold whitespace-nowrap">
                  + 파티 생성하기{' '}
                </p>
                {/* 모바일 가로 공간 부족 시 부가 설명 숨김 */}
                <p className="hidden mt-1 text-sm text-white/70 sm:block">
                  직접 모집글을 올리고 멤버를 모아보세요.
                </p>
              </div>
              <span className="text-xl md:text-2xl shrink-0">🍿</span>
            </div>
          </button>

          <button
            onClick={onQuickMatch}
            className="flex-1 rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 md:px-4 md:py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 active:scale-95 md:active:scale-100"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="hidden text-xs font-bold uppercase tracking-[0.2em] text-slate-400 md:block">
                  Quick match
                </p>
                <p className="text-sm md:mt-1 md:text-base font-extrabold text-slate-900 whitespace-nowrap">
                  빠른 매칭
                </p>
                <p className="hidden mt-1 text-sm text-slate-500 sm:block">
                  조건만 입력하면 맞는 파티를 더 빠르게 찾아드려요.
                </p>
                <p className="hidden mt-1 text-xs text-amber-600 sm:block">
                  * 빠른 매칭 이용 시 수수료 부과
                </p>
              </div>
              <span className="text-xl md:text-2xl shrink-0">⚡️</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
