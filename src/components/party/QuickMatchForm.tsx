import { useEffect, useMemo, useState } from 'react';

type QuickMatchFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    category: string;
    serviceId: string;
    period: string;
  }) => void;
};

const SERVICE_MAP = {
  OTT: [
    { id: 'ott_tving', name: '티빙' },
    { id: 'ott_disney_plus', name: '디즈니+' },
    { id: 'ott_laftel', name: '라프텔' },
    { id: 'ott_apple_tv_plus', name: '애플TV+' },
    { id: 'ott_netflix', name: '넷플릭스' },
    { id: 'ott_wavve', name: '웨이브' },
    { id: 'ott_watcha', name: '왓챠' },
  ],
  교육: [
    { id: 'edu_super_duolingo', name: '슈퍼 듀오링고' },
    { id: 'edu_millie', name: '밀리의서재' },
  ],
  음악: [
    { id: 'music_spotify_premium', name: '스포티파이 프리미엄' },
    { id: 'music_apple_music', name: '애플뮤직' },
    { id: 'music_flo', name: 'FLO' },
  ],
  기타: [
    { id: 'etc_naver_plus', name: '네이버플러스' },
    { id: 'etc_apple_one', name: '애플ONE' },
    { id: 'etc_snow_vip', name: '스노우VIP' },
    { id: 'etc_chatgpt', name: 'ChatGPT' },
    { id: 'etc_microsoft_365', name: '마이크로소프트365' },
  ],
} as const;

const CATEGORY_OPTIONS = ['OTT', '교육', '음악', '기타'] as const;

const PERIOD_OPTIONS = [
  { value: '', label: '기간 선택 안 함' },
  { value: '1개월', label: '1개월' },
  { value: '3개월', label: '3개월' },
  { value: '6개월', label: '6개월' },
  { value: '12개월', label: '12개월' },
];

export default function QuickMatchForm({
  open,
  onClose,
  onSubmit,
}: QuickMatchFormProps) {
  const [category, setCategory] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [period, setPeriod] = useState('');

  useEffect(() => {
    if (!open) {
      setCategory('');
      setServiceId('');
      setPeriod('');
    }
  }, [open]);

  const serviceOptions = useMemo(() => {
    if (!category) return [];
    return SERVICE_MAP[category as keyof typeof SERVICE_MAP] ?? [];
  }, [category]);

  if (!open) return null;

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setServiceId('');
  };

  const handleSubmit = () => {
    if (!category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    if (!serviceId) {
      alert('플랫폼을 선택해주세요.');
      return;
    }

    onSubmit({
      category,
      serviceId,
      period,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-slate-900">빠른 매칭</h2>
          <p className="mt-1 text-sm text-slate-500">
            카테고리와 플랫폼을 선택하면 빠르게 파티를 찾아드려요.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              카테고리 <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">카테고리를 선택해주세요</option>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              플랫폼 <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              disabled={!category}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {category
                  ? '플랫폼을 선택해주세요'
                  : '먼저 카테고리를 선택해주세요'}
              </option>
              {serviceOptions.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              기간 <span className="text-slate-400">(선택)</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            빠른 매칭 시작
          </button>
        </div>
      </div>
    </div>
  );
}
