const services = [
  { name: 'Netflix', logo: '/service-logos/netflix.png' },
  { name: 'Disney+', logo: '/service-logos/disney-plus.png' },
  { name: 'Tving', logo: '/service-logos/tving.png' },
  { name: 'Wavve', logo: '/service-logos/wavve.png' },
  { name: 'Watcha', logo: '/service-logos/watcha.jpeg' },
  { name: 'Laftel', logo: '/service-logos/laftel.png' },
  { name: 'Spotify', logo: '/service-logos/spotify.png' },
  { name: 'Apple Music', logo: '/service-logos/apple-music.png' },
  { name: 'FLO', logo: '/service-logos/flo.png' },
  { name: 'YouTube', logo: '/service-logos/youtube.png' },
  { name: 'Coupang', logo: '/service-logos/coupang.png' },
  { name: 'Naver Plus', logo: '/service-logos/naver-plus.png' },
  { name: 'ChatGPT Plus', logo: '/service-logos/chatgpt-plus.jpg' },
  { name: 'Microsoft 365', logo: '/service-logos/microsoft-365.jpg' },
  { name: 'Apple TV+', logo: '/service-logos/apple-tv-plus.png' },
  { name: 'Apple One', logo: '/service-logos/apple-one.png' },
  { name: 'RIDI', logo: '/service-logos/RIDI.png' },
  { name: 'Millie', logo: '/service-logos/millie.png' },
  { name: 'Duolingo', logo: '/service-logos/super-duolingo.jpeg' },
];

// 롤링용 2배 복제
const doubled = [...services, ...services];

export default function ServiceBannerSection() {
  return (
    <div className="w-full py-10 bg-gray-50/80 border-y border-gray-100 overflow-hidden">
      <p className="text-center text-xs font-bold text-gray-400 tracking-widest uppercase mb-6">
        지원 구독 서비스
      </p>

      <div className="relative">
        {/* 좌우 페이드 */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50/80 to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-6 items-center"
          style={{
            animation: 'scroll-left 30s linear infinite',
            width: 'max-content',
          }}
        >
          {doubled.map((s, i) => (
            <div
              key={`${s.name}-${i}`}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={s.logo}
                  alt={s.name}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
