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
    { id: 'd291df64-74a0-4b26-bc32-1811a6912cf9', name: '티빙' },
    { id: 'bc087bf5-1286-4572-9268-0e100036ce5a', name: '넷플릭스' },
    { id: '84969135-2545-4dc7-a800-ff0bfeb5a643', name: '디즈니플러스' },
    { id: 'f07acd67-39a4-42ad-8b83-e29181cf9f55', name: '웨이브' },
    { id: '7c2025d2-72c2-448f-99d4-03a324c629a4', name: '왓챠' },
    { id: 'f543b795-a9a7-45be-80f2-e378db05bcfe', name: '라프텔' },
  ],
  '교육/도서': [
    { id: 'bf03cdb6-0776-4499-86fb-a8559c9cf219', name: '밀리의 서재' },
    { id: 'b6efbdeb-0d84-4940-b2bd-83a18dc71b47', name: '리디 셀렉트' },
  ],
  음악: [
    { id: '2e9288af-f3a1-4b90-8c09-4ea0dfd27164', name: '스포티파이' },
    { id: '37a890be-7596-4317-b9a4-de2f85da095a', name: '애플 뮤직' },
    { id: 'd48bde3d-88f2-482d-83f8-14564ddf9b74', name: '유튜브' },
    { id: '32bfbda8-33db-4924-a7b0-a88871716b9e', name: '쿠팡' },
  ],
  '생산성/기타': [
    { id: 'ca41c7d0-73a2-4cd5-a0d2-702c79d06fae', name: 'ChatGPT Plus' },
    { id: '2b0ef251-c062-4cca-979c-c2041868957c', name: 'Microsoft 365' },
  ],
} as const;

const CATEGORY_OPTIONS = ['OTT', '교육/도서', '음악', '생산성/기타'] as const;

const PERIOD_OPTIONS = [
  { value: '', label: '상관없음' },
  { value: '1개월', label: '1~3개월 이용' },
  { value: '3개월', label: '3~6개월 이용' },
  { value: '6개월', label: '6개월 이상 이용' },
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
              선호 기간 <span className="text-slate-400">(선택)</span>
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
