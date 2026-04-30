import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react'; // 💡 화살표 아이콘 추가 (lucide-react가 없다면 일반 svg로 대체 가능)

import { useAuthStore } from '../../stores/authStore';

type QuickMatchFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    service_id: string;
    preferred_conditions?: {
      duration_preference?: 'under_1_month' | '1_3_months' | 'over_3_months';
    };
  }) => void;
  isSubmitting?: boolean;
};

const SERVICE_MAP = {
  OTT: [
    { id: 'bc087bf5-1286-4572-9268-0e100036ce5a', name: '넷플릭스' },
    { id: '84969135-2545-4dc7-a800-ff0bfeb5a643', name: '디즈니+' },
    { id: 'd291df64-74a0-4b26-bc32-1811a6912cf9', name: '티빙' },
    { id: '7c2025d2-72c2-448f-99d4-03a324c629a4', name: '왓챠' },
    { id: 'f543b795-a9a7-45be-80f2-e378db05bcfe', name: '라프텔' },
    { id: 'f07acd67-39a4-42ad-8b83-e29181cf9f55', name: '웨이브' },
  ],

  '교육/도서': [
    { id: 'bf03cdb6-0776-4499-86fb-a8559c9cf219', name: '밀리의 서재' },
    { id: 'b6efbdeb-0d84-4940-b2bd-83a18dc71b47', name: '리디 셀렉트' },
  ],

  '음악/멤버십': [
    { id: '2e9288af-f3a1-4b90-8c09-4ea0dfd27164', name: '스포티파이' },
    { id: '37a890be-7596-4317-b9a4-de2f85da095a', name: '애플 뮤직' },
    { id: 'd48bde3d-88f2-482d-83f8-14564ddf9b74', name: '유튜브 프리미엄' },
    { id: '32bfbda8-33db-4924-a7b0-a88871716b9e', name: '쿠팡 와우' },
  ],

  '생산성/기타': [
    { id: 'ca41c7d0-73a2-4cd5-a0d2-702c79d06fae', name: 'ChatGPT Plus' },
    { id: '2b0ef251-c062-4cca-979c-c2041868957c', name: 'Microsoft 365' },
  ],
} as const;

const CATEGORY_OPTIONS = [
  'OTT',
  '교육/도서',
  '음악/멤버십',
  '생산성/기타',
] as const;

const DURATION_OPTIONS = [
  { value: '', label: '상관없음' },
  { value: 'under_1_month', label: '1개월 이하' },
  { value: '1_3_months', label: '1~3개월' },
  { value: 'over_3_months', label: '3개월 이상' },
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
  const [durationPreference, setDurationPreference] = useState<
    '' | 'under_1_month' | '1_3_months' | 'over_3_months'
  >('');

  const resetForm = () => {
    setCategory('');
    setServiceId('');
    setDurationPreference('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const serviceOptions = useMemo(() => {
    if (!category) return [];
    return SERVICE_MAP[category as keyof typeof SERVICE_MAP] ?? [];
  }, [category]);

  if (!open) return null;

  const moveToLogin = () => {
    const redirectPath = `${location.pathname}${location.search}`;
    handleClose();
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
      duration_preference?: 'under_1_month' | '1_3_months' | 'over_3_months';
    } = {};

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
      onClick={isSubmitting ? undefined : handleClose}
    >
      <div
        // 패딩 및 라운딩 유연화
        className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            빠른 매칭
          </h2>
          <p className="mt-1 sm:mt-1.5 break-keep text-xs sm:text-sm leading-relaxed text-slate-500">
            원하는 서비스와 선호 조건을 선택하면 빠르게 어울리는 파티를
            찾아드려요.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {/* 카테고리 선택 */}
          <div>
            <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-800">
              카테고리 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={isSubmitting || loading}
                // appearance-none 으로 기본 화살표 제거, 모바일 터치를 위해 py 증가
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">카테고리를 선택해주세요</option>
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* 플랫폼 선택 */}
          <div>
            <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-800">
              플랫폼 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={!category || isSubmitting || loading}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-400"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* 이용 기간 선택 */}
          <div>
            <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-800">
              이용 기간{' '}
              <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <div className="relative">
              <select
                value={durationPreference}
                onChange={(e) =>
                  setDurationPreference(
                    e.target.value as
                      | ''
                      | 'under_1_month'
                      | '1_3_months'
                      | 'over_3_months',
                  )
                }
                disabled={isSubmitting || loading}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl sm:rounded-2xl border border-slate-200 px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="flex-2 sm:flex-1 rounded-xl sm:rounded-2xl bg-primary px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:brightness-95 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '매칭 중...' : '빠른 매칭 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
