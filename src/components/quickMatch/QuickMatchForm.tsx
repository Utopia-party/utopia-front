import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

type QuickMatchFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    service_id: string;
    preferred_conditions?: {
      price_range?: string;
      duration_preference?: 'short_term' | 'long_term' | 'flexible';
    };
  }) => void;
  isSubmitting?: boolean;
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

const PRICE_RANGE_OPTIONS = [
  { value: '', label: '상관없음' },
  { value: '0-5000', label: '5,000원 이하' },
  { value: '5000-10000', label: '5,000원 ~ 10,000원' },
  { value: '10000-20000', label: '10,000원 ~ 20,000원' },
  { value: '20000-999999', label: '20,000원 이상' },
];

const DURATION_OPTIONS = [
  { value: '', label: '상관없음' },
  { value: 'short_term', label: '단기 이용 선호' },
  { value: 'long_term', label: '장기 이용 선호' },
  { value: 'flexible', label: '유연하게 가능' },
] as const;

export default function QuickMatchForm({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: QuickMatchFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, loading } = useAuthStore();

  const [category, setCategory] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [durationPreference, setDurationPreference] = useState<
    '' | 'short_term' | 'long_term' | 'flexible'
  >('');

  useEffect(() => {
    if (!open) {
      setCategory('');
      setServiceId('');
      setPriceRange('');
      setDurationPreference('');
    }
  }, [open]);

  const serviceOptions = useMemo(() => {
    if (!category) return [];
    return SERVICE_MAP[category as keyof typeof SERVICE_MAP] ?? [];
  }, [category]);

  if (!open) return null;

  const moveToLogin = () => {
    const redirectPath = `${location.pathname}${location.search}`;
    onClose();

    navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setServiceId('');
  };

  const handleSubmit = () => {
    if (isSubmitting || loading) return;

    if (!isLoggedIn) {
      alert('빠른매칭은 로그인 후 이용할 수 있습니다.');
      moveToLogin();
      return;
    }

    if (!category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    if (!serviceId) {
      alert('플랫폼을 선택해주세요.');
      return;
    }

    const preferredConditions: {
      price_range?: string;
      duration_preference?: 'short_term' | 'long_term' | 'flexible';
    } = {};

    if (priceRange) {
      preferredConditions.price_range = priceRange;
    }

    if (durationPreference) {
      preferredConditions.duration_preference = durationPreference;
    }

    onSubmit({
      service_id: serviceId,
      preferred_conditions:
        Object.keys(preferredConditions).length > 0
          ? preferredConditions
          : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-slate-900">빠른 매칭</h2>
          <p className="mt-1 text-sm text-slate-500">
            원하는 서비스와 선호 조건을 선택하면 빠르게 어울리는 파티를
            찾아드려요.
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
              disabled={isSubmitting || loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
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
              disabled={!category || isSubmitting || loading}
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
              희망 가격대 <span className="text-slate-400">(선택)</span>
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              disabled={isSubmitting || loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
            >
              {PRICE_RANGE_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              이용 기간 성향 <span className="text-slate-400">(선택)</span>
            </label>
            <select
              value={durationPreference}
              onChange={(e) =>
                setDurationPreference(
                  e.target.value as
                    | ''
                    | 'short_term'
                    | 'long_term'
                    | 'flexible',
                )
              }
              disabled={isSubmitting || loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
          ⚠️ 빠른매칭은 자동으로 파티를 탐색하고 참여까지 진행하는 기능이며,
          서비스에 따라 수수료가 발생할 수 있습니다.
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '매칭 중...' : '빠른 매칭 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
