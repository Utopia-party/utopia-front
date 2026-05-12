const navItems = [
  { href: '#before-start', label: '시작 전 확인' },
  { href: '#login', label: '로그인' },
  { href: '#find-party', label: '파티 찾기' },
  { href: '#join-party', label: '참여하기' },
  { href: '#quick-match', label: '빠른매칭' },
  { href: '#chat-payment', label: '채팅/파티관리' },
  { href: '#praise', label: '칭찬하기' },
  { href: '#payment', label: '정산/결제' },
  { href: '#create-party', label: '파티 만들기' },
  { href: '#mypage', label: '마이페이지' },
  { href: '#report', label: '신고' },
  { href: '#appeal', label: '이의신청' },
  { href: '#trust-score', label: '신뢰도 안내' },
  { href: '#status', label: '상태 뜻' },
  { href: '#troubleshooting', label: '문제 해결' },
];

export default function ManualNav() {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
