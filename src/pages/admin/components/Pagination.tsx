export default function Pagination({
  total,
  page,
  pageSize,
  onChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 4) pages.push('...');
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      pages.push(i);
    }
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btnBase =
    'inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2 text-sm font-medium transition';
  const btnActive = 'border-blue-500 bg-blue-500 text-white';
  const btnDefault = 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50';
  const btnDisabled = 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed';

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400">
        총 {total.toLocaleString()}건 · {page}/{totalPages} 페이지
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(1)}
          disabled={page === 1}
          className={`${btnBase} ${page === 1 ? btnDisabled : btnDefault}`}
        >
          «
        </button>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={`${btnBase} ${page === 1 ? btnDisabled : btnDefault}`}
        >
          ‹
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`${btnBase} ${page === p ? btnActive : btnDefault}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} ${page === totalPages ? btnDisabled : btnDefault}`}
        >
          ›
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={page === totalPages}
          className={`${btnBase} ${page === totalPages ? btnDisabled : btnDefault}`}
        >
          »
        </button>
      </div>
    </div>
  );
}
