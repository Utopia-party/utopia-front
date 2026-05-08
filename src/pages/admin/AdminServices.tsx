import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  createAdminService,
  deleteAdminService,
  fetchAdminServices,
  getAdminErrorMessage,
  updateAdminService,
  type AdminServiceCreatePayload,
  type AdminServiceRecord,
  type AdminServiceUpdatePayload,
  uploadAdminServiceLogo,
} from '../../apis/admin';

const STATUS_STYLE: Record<string, string> = {
  활성: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  비활성: 'bg-slate-100 text-slate-600 border-slate-200',
};

const MAX_SERVICE_PRICE = 2_147_483_647;
const SERVICE_CATEGORIES = ['OTT', '교육/도서', '음악/멤버십', '생산성/기타'];

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;
const formatRate = (value: number) => `${Math.round(value * 100)}%`;
const getLogoSrc = (service: AdminServiceRecord) =>
  service.logoImageUrl || null;
const getDiscountedPrice = (price: number, discountRate: number) =>
  Math.round(price * (1 - discountRate));
const getSellingPrice = (originalPrice: number, commissionRate: number) =>
  Math.round(originalPrice * (1 + commissionRate));

const validateServiceDraft = (draft: AdminServiceUpdatePayload) => {
  if (!Number.isInteger(draft.maxMembers) || draft.maxMembers < 1) {
    return '최대 인원은 1명 이상 정수여야 합니다.';
  }
  if (!Number.isInteger(draft.originalPrice) || draft.originalPrice < 0) {
    return '원래 가격은 0원 이상 정수여야 합니다.';
  }
  if (!Number.isInteger(draft.monthlyPrice) || draft.monthlyPrice < 0) {
    return '판매가는 0원 이상 정수여야 합니다.';
  }
  if (
    draft.originalPrice > MAX_SERVICE_PRICE ||
    draft.monthlyPrice > MAX_SERVICE_PRICE
  ) {
    return `가격은 ${formatWon(MAX_SERVICE_PRICE)} 이하여야 합니다.`;
  }
  return '';
};

const validateCreateDraft = (draft: AdminServiceCreatePayload) => {
  if (!draft.name.trim()) {
    return '서비스 이름을 입력해주세요.';
  }
  if (!draft.category.trim()) {
    return '카테고리를 입력해주세요.';
  }
  return validateServiceDraft(draft);
};

function DiscountHoverValue({
  rate,
  discountedPrice,
}: {
  rate: number;
  discountedPrice: number;
}) {
  return (
    <span className="inline-flex min-w-17.5 md:min-w-23">
      {/* 💡 모바일에서는 터치(Hover 대체) 시 툴팁이 짤리지 않게 right-0 등 추가 고려 가능, 현재는 기본 유지 */}
      <span className="group relative inline-flex cursor-help flex-col items-start">
        <span className="underline decoration-dotted underline-offset-4">
          {formatRate(rate)}
        </span>
        <span className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] md:text-[11px] font-medium text-white shadow-lg group-hover:block">
          할인가 {formatWon(discountedPrice)}
        </span>
      </span>
    </span>
  );
}

const draftFromService = (
  service: AdminServiceRecord,
): AdminServiceUpdatePayload => ({
  maxMembers: service.maxMembers,
  monthlyPrice: service.monthlyPrice,
  originalPrice: service.originalPrice,
  logoImageKey: service.logoImageKey ?? '',
  isActive: service.isActive,
  commissionRate: service.commissionRate,
  leaderDiscountRate: service.leaderDiscountRate,
  referralDiscountRate: service.referralDiscountRate,
  quickMatchFeeRate: service.quickMatchFeeRate,
});

const createEmptyDraft = (category = 'OTT'): AdminServiceCreatePayload => ({
  name: '',
  category,
  maxMembers: 4,
  monthlyPrice: 0,
  originalPrice: 0,
  logoImageKey: '',
  isActive: true,
  commissionRate: 0.3,
  leaderDiscountRate: 0.05,
  referralDiscountRate: 0.05,
  quickMatchFeeRate: 0.05,
});

export default function AdminServices() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('전체');
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [services, setServices] = useState<AdminServiceRecord[]>([]);
  const [createDraft, setCreateDraft] =
    useState<AdminServiceCreatePayload>(createEmptyDraft());
  const [createLogoPreview, setCreateLogoPreview] = useState<string | null>(
    null,
  );
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null,
  );
  const [drafts, setDrafts] = useState<
    Record<string, AdminServiceUpdatePayload>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyServiceId, setBusyServiceId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError('');
        const nextServices = await fetchAdminServices();
        if (alive) {
          setServices(nextServices);
        }
      } catch (err) {
        if (alive) {
          setError(getAdminErrorMessage(err));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void loadServices();
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category))),
    [services],
  );

  useEffect(() => {
    if (!isCreatePanelOpen) {
      setCreateDraft(createEmptyDraft(categories[0] ?? 'OTT'));
      setCreateLogoPreview(null);
    }
  }, [categories, isCreatePanelOpen]);

  const filterTabs = useMemo(
    () => ['전체', '활성', '비활성', ...categories],
    [categories],
  );

  const reloadServices = async () => {
    setLoading(true);
    setError('');
    try {
      setServices(await fetchAdminServices());
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDetail = (service: AdminServiceRecord) => {
    setExpandedServiceId((prev) => (prev === service.id ? null : service.id));
    setDrafts((prev) =>
      prev[service.id]
        ? prev
        : { ...prev, [service.id]: draftFromService(service) },
    );
  };

  const handleDraftChange = (
    serviceId: string,
    key: keyof AdminServiceUpdatePayload,
    value: string | number | boolean,
  ) => {
    setDrafts((prev) => {
      const current = prev[serviceId];
      if (!current) {
        return prev;
      }
      const nextDraft = {
        ...current,
        [key]: value,
      };

      if (key === 'originalPrice' || key === 'commissionRate') {
        nextDraft.monthlyPrice = getSellingPrice(
          Number(nextDraft.originalPrice),
          Number(nextDraft.commissionRate),
        );
      }

      return {
        ...prev,
        [serviceId]: nextDraft,
      };
    });
  };

  const handleResetDraft = (service: AdminServiceRecord) => {
    setDrafts((prev) => ({
      ...prev,
      [service.id]: draftFromService(service),
    }));
  };

  const handleSave = async (service: AdminServiceRecord) => {
    const draft = drafts[service.id];
    if (!draft) {
      return;
    }

    const validationMessage = validateServiceDraft(draft);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setBusyServiceId(service.id);
      setError('');
      const payload: AdminServiceUpdatePayload = {
        ...draft,
        logoImageKey: draft.logoImageKey?.trim() || null,
      };
      await updateAdminService(service.id, payload);
      await reloadServices();
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyServiceId(null);
    }
  };

  const handleCreateDraftChange = (
    key: keyof AdminServiceCreatePayload,
    value: string | number | boolean,
  ) => {
    setCreateDraft((prev) => {
      const nextDraft = {
        ...prev,
        [key]: value,
      };

      if (key === 'originalPrice' || key === 'commissionRate') {
        nextDraft.monthlyPrice = getSellingPrice(
          Number(nextDraft.originalPrice),
          Number(nextDraft.commissionRate),
        );
      }

      return nextDraft;
    });
  };

  const handleCreateService = async () => {
    const validationMessage = validateCreateDraft(createDraft);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setBusyServiceId('create');
      setError('');
      await createAdminService({
        ...createDraft,
        name: createDraft.name.trim(),
        category: createDraft.category.trim(),
        logoImageKey: createDraft.logoImageKey?.trim() || null,
      });
      await reloadServices();
      setActiveTab('전체');
      setIsCreatePanelOpen(false);
      setCreateDraft(createEmptyDraft(categories[0] ?? 'OTT'));
      setCreateLogoPreview(null);
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyServiceId(null);
    }
  };

  const handleDeleteService = async (service: AdminServiceRecord) => {
    const confirmed = window.confirm(
      `"${service.name}" 서비스를 삭제할까요?\n사용 중인 서비스는 삭제되지 않습니다.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setBusyServiceId(service.id);
      setError('');
      await deleteAdminService(service.id);
      if (expandedServiceId === service.id) {
        setExpandedServiceId(null);
      }
      await reloadServices();
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyServiceId(null);
    }
  };

  const handleUploadCreateLogo = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusyServiceId('create-logo');
      setError('');
      const uploaded = await uploadAdminServiceLogo(file);
      setCreateDraft((prev) => ({
        ...prev,
        logoImageKey: uploaded.logoImageKey,
      }));
      setCreateLogoPreview(uploaded.logoImageUrl);
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyServiceId(null);
      event.target.value = '';
    }
  };

  const filtered = useMemo(() => {
    let data = services;

    if (activeTab === '활성') {
      data = data.filter((service) => service.isActive);
    } else if (activeTab === '비활성') {
      data = data.filter((service) => !service.isActive);
    } else if (activeTab !== '전체') {
      data = data.filter((service) => service.category === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (service) =>
          service.id.toLowerCase().includes(q) ||
          service.name.toLowerCase().includes(q) ||
          service.category.toLowerCase().includes(q) ||
          (service.logoImageKey || '').toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, search, services]);

  const summary = useMemo(
    () => [
      { label: '전체 서비스', value: `${services.length}` },
      {
        label: '활성 서비스',
        value: `${services.filter((service) => service.isActive).length}`,
      },
    ],
    [services],
  );

  return (
    // 💡 최상위 wrapper: flex-1 추가하여 축소 방지
    <div className="flex w-full min-w-0 flex-1 flex-col">
      <AdminHeader
        placeholder="서비스 검색 (이름/카테고리)..."
        onSearch={setSearch}
      />

      {/* 💡 전반적인 패딩 최적화 */}
      <div className="flex-1 bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
          <section>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-keep">
              구독 서비스 관리
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 break-keep">
              서비스별 원래 가격, 월 판매가, 할인율과 활성 상태를 토글형
              편집으로 관리합니다.
            </p>
          </section>

          {isCreatePanelOpen && (
            <section className="rounded-xl md:rounded-2xl border border-blue-200 bg-blue-50/70 p-4 md:p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-slate-900">
                    구독 서비스 추가
                  </h2>
                  <p className="mt-1 text-[11px] md:text-sm text-slate-500 break-keep">
                    서비스명, 가격, 할인율을 입력하면 관리자 목록에 바로
                    추가됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatePanelOpen(false);
                    setCreateDraft(createEmptyDraft(categories[0] ?? 'OTT'));
                    setCreateLogoPreview(null);
                  }}
                  className="self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                >
                  닫기
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    서비스 이름
                  </span>
                  <input
                    type="text"
                    value={createDraft.name}
                    onChange={(event) =>
                      handleCreateDraftChange('name', event.target.value)
                    }
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                    placeholder="예: Apple Music"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    카테고리
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_CATEGORIES.map((item) => {
                      const isActive = createDraft.category === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            handleCreateDraftChange('category', item)
                          }
                          className={`rounded-full border px-3 py-2 text-xs font-bold transition active:scale-95 ${
                            isActive
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    최대 인원
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={createDraft.maxMembers}
                    onChange={(event) =>
                      handleCreateDraftChange(
                        'maxMembers',
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    원래 가격(월)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={MAX_SERVICE_PRICE}
                    value={createDraft.originalPrice}
                    onChange={(event) =>
                      handleCreateDraftChange(
                        'originalPrice',
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    판매가(월)
                  </span>
                  <input
                    type="number"
                    value={createDraft.monthlyPrice}
                    readOnly
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    수수료율
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step="0.01"
                    value={createDraft.commissionRate}
                    onChange={(event) =>
                      handleCreateDraftChange(
                        'commissionRate',
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    방장 할인율
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step="0.01"
                    value={createDraft.leaderDiscountRate}
                    onChange={(event) =>
                      handleCreateDraftChange(
                        'leaderDiscountRate',
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    추천 할인율
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step="0.01"
                    value={createDraft.referralDiscountRate}
                    onChange={(event) =>
                      handleCreateDraftChange(
                        'referralDiscountRate',
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    빠른매칭 수수료율
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step="0.01"
                    value={createDraft.quickMatchFeeRate}
                    onChange={(event) =>
                      handleCreateDraftChange(
                        'quickMatchFeeRate',
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>
                <div className="flex flex-col gap-1.5 md:gap-2 xl:col-span-2">
                  <span className="text-xs md:text-sm font-bold text-slate-700">
                    로고 이미지
                  </span>
                  <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 md:flex-row md:items-center">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {createLogoPreview ? (
                        <img
                          src={createLogoPreview}
                          alt="서비스 로고 미리보기"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          NO IMAGE
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                        onChange={(event) => void handleUploadCreateLogo(event)}
                        className="text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-blue-700"
                      />
                      <p className="text-[10px] text-slate-400 break-all">
                        {createDraft.logoImageKey ||
                          '업로드된 로고 키가 여기에 표시됩니다.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleCreateService()}
                  disabled={busyServiceId === 'create'}
                  className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {busyServiceId === 'create' ? '추가 중...' : '서비스 추가'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateDraft(createEmptyDraft(categories[0] ?? 'OTT'));
                    setCreateLogoPreview(null);
                  }}
                  className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                >
                  입력 초기화
                </button>
              </div>
            </section>
          )}

          {/* 💡 요약 카드: 2단 배치 및 크기 유연화 */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm"
              >
                <p className="text-[11px] md:text-sm text-gray-500 truncate">
                  {item.label}
                </p>
                <p className="mt-1 md:mt-2 text-xl md:text-2xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <FilterTabs
            tabs={filterTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-900">서비스 목록</p>
              <p className="mt-0.5 text-xs text-slate-500">
                서비스 수정, 삭제, 신규 추가를 여기서 바로 진행합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen((prev) => !prev)}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95"
            >
              {isCreatePanelOpen ? '추가 닫기' : '서비스 추가'}
            </button>
          </div>

          <section className="rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsGuideOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="text-[11px] md:text-xs font-semibold text-slate-500">
                구독 서비스 메뉴얼
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {isGuideOpen ? '접기' : '펼치기'}
              </span>
            </button>

            {isGuideOpen && (
              <div className="mt-3 space-y-3 text-[11px] md:text-xs text-slate-600">
                <div className="rounded-xl border border-white bg-white px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    구독 서비스 관리 메뉴얼
                  </div>
                  <p className="mt-2 leading-relaxed">
                    구독 서비스 관리 페이지는 서비스별 가격, 할인율, 빠른매칭
                    수수료, 활성 상태를 운영 기준에 맞게 조정하는 화면입니다.
                    신규 서비스를 추가하거나 기존 서비스 설정을 수정하고, 사용
                    여부까지 한 번에 관리할 수 있습니다.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">
                      이 페이지에서 할 수 있는 기능
                    </div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 서비스 이름, 카테고리, 최대 인원, 원가, 판매가를
                        조회하고 수정할 수 있습니다.
                      </p>
                      <p>
                        2. 방장 할인, 추천 할인, 빠른매칭 수수료를 서비스별로
                        다르게 설정할 수 있습니다.
                      </p>
                      <p>
                        3. 신규 서비스를 추가하고 로고 이미지를 업로드해 목록에
                        바로 반영할 수 있습니다.
                      </p>
                      <p>
                        4. 사용하지 않는 서비스는 삭제하거나 비활성으로 전환해
                        신규 운영 대상에서 제외할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">사용 방법</div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 서비스 목록에서 수정할 대상을 찾고 `가격 수정`
                        버튼으로 상세 패널을 엽니다.
                      </p>
                      <p>
                        2. 가격과 할인율을 변경한 뒤 판매가 자동 계산 결과를
                        확인하고 저장합니다.
                      </p>
                      <p>
                        3. 새 서비스가 필요하면 `서비스 추가` 버튼을 눌러 입력
                        패널을 열고 정보와 로고를 등록합니다.
                      </p>
                      <p>
                        4. 삭제가 필요한 경우 서비스가 실제 파티에서 사용 중인지
                        먼저 확인한 뒤 삭제를 진행합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <div className="font-bold text-slate-800">운영 시 참고</div>
                  <div className="mt-2 space-y-1.5 leading-relaxed text-slate-600">
                    <p>
                      할인율과 수수료율을 바꾸면 이후 생성되거나 결제되는 파티에
                      영향이 갈 수 있으니 반영 범위를 먼저 확인하는 것이
                      좋습니다.
                    </p>
                    <p>
                      이미 파티에서 사용 중인 서비스는 운영 데이터 보호를 위해
                      삭제가 제한될 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {loading && (
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm text-gray-500 shadow-sm">
              서비스 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-xl md:rounded-2xl border border-red-200 bg-red-50 px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* 💡 테이블 가로 스크롤 설정 (10개 컬럼을 위해 충분한 min-w 확보) */}
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <table className="min-w-250 w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      서비스
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      카테고리
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      최대 인원
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      원래 가격
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      판매가
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      수수료
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      방장 할인
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      추천 할인
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      빠른매칭 수수료
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      상태
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((service) => {
                    const isExpanded = expandedServiceId === service.id;
                    const draft =
                      drafts[service.id] ?? draftFromService(service);
                    const statusLabel = service.isActive ? '활성' : '비활성';

                    return (
                      <Fragment key={service.id}>
                        <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                          <td className="px-3 md:px-4 py-3.5 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg md:rounded-xl border border-slate-200 bg-slate-50">
                                {getLogoSrc(service) ? (
                                  <img
                                    src={getLogoSrc(service)!}
                                    alt={service.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] md:text-xs font-bold text-slate-400">
                                    NO
                                  </span>
                                )}
                              </div>
                              <div className="font-semibold text-gray-900 break-keep">
                                {service.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {service.category}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {service.maxMembers}명
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {formatWon(service.originalPrice)}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {formatWon(service.monthlyPrice)}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {formatRate(service.commissionRate)}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            <DiscountHoverValue
                              rate={service.leaderDiscountRate}
                              discountedPrice={getDiscountedPrice(
                                service.monthlyPrice,
                                service.leaderDiscountRate,
                              )}
                            />
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            <DiscountHoverValue
                              rate={service.referralDiscountRate}
                              discountedPrice={getDiscountedPrice(
                                service.monthlyPrice,
                                service.referralDiscountRate,
                              )}
                            />
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {formatRate(service.quickMatchFeeRate)}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-sm">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-semibold ${STATUS_STYLE[statusLabel]}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-sm">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                className={`rounded-lg border px-2.5 py-1.5 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold transition active:scale-95 ${
                                  isExpanded
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => handleToggleDetail(service)}
                              >
                                {isExpanded ? '닫기' : '가격 수정'}
                              </button>
                              <button
                                type="button"
                                disabled={busyServiceId === service.id}
                                onClick={() =>
                                  void handleDeleteService(service)
                                }
                                className="rounded-lg border border-red-300 px-2.5 py-1.5 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold text-red-600 transition hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {busyServiceId === service.id
                                  ? '삭제 중...'
                                  : '삭제'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* 💡 확장 패널 (아코디언 영역) */}
                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={11} className="p-3 md:px-4 md:py-4">
                              <div className="grid gap-3 md:gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
                                <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-2.5 md:gap-3">
                                      <div className="flex h-10 w-10 md:h-14 md:w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50">
                                        {getLogoSrc(service) ? (
                                          <img
                                            src={getLogoSrc(service)!}
                                            alt={service.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-[10px] md:text-xs font-bold text-slate-400">
                                            NO IMAGE
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <h3 className="text-sm md:text-base font-bold text-slate-900 break-keep">
                                          {service.name} 설정 편집
                                        </h3>
                                        <p className="mt-0.5 md:mt-1 text-[11px] md:text-sm text-slate-500 break-keep">
                                          가격과 할인율을 수정하면 즉시
                                          반영됩니다.
                                        </p>
                                      </div>
                                    </div>
                                    <span className="self-start rounded-full border border-slate-200 bg-slate-50 px-2 py-1 md:px-2.5 md:py-1 text-[10px] md:text-xs font-medium text-slate-500">
                                      최근 수정 {service.updatedAt}
                                    </span>
                                  </div>

                                  <div className="mt-4 md:mt-5 grid gap-3 md:gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        최대 인원
                                      </span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={draft.maxMembers}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'maxMembers',
                                            Number(event.target.value),
                                          )
                                        }
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        원래 가격(월)
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={MAX_SERVICE_PRICE}
                                        step={1}
                                        value={draft.originalPrice}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'originalPrice',
                                            Number(event.target.value),
                                          )
                                        }
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        판매가(월)
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={MAX_SERVICE_PRICE}
                                        step={1}
                                        value={draft.monthlyPrice}
                                        readOnly
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 outline-none"
                                      />
                                      <span className="text-[10px] md:text-xs text-slate-400 break-keep">
                                        원가 + 수수료율 기준으로 자동
                                        계산됩니다.
                                      </span>
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        수수료율
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step="0.01"
                                        value={draft.commissionRate}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'commissionRate',
                                            Number(event.target.value),
                                          )
                                        }
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2 md:col-span-2 xl:col-span-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        로고 이미지 키
                                      </span>
                                      <input
                                        type="text"
                                        value={draft.logoImageKey ?? ''}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'logoImageKey',
                                            event.target.value,
                                          )
                                        }
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        방장 할인율
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step="0.01"
                                        value={draft.leaderDiscountRate}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'leaderDiscountRate',
                                            Number(event.target.value),
                                          )
                                        }
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        추천 할인율
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step="0.01"
                                        value={draft.referralDiscountRate}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'referralDiscountRate',
                                            Number(event.target.value),
                                          )
                                        }
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        빠른매칭 수수료율
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step="0.01"
                                        value={draft.quickMatchFeeRate}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'quickMatchFeeRate',
                                            Number(event.target.value),
                                          )
                                        }
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-1.5 md:gap-2">
                                      <span className="text-xs md:text-sm font-bold text-slate-700">
                                        활성 상태
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDraftChange(
                                            service.id,
                                            'isActive',
                                            !draft.isActive,
                                          )
                                        }
                                        className={`rounded-lg md:rounded-xl border px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-bold transition active:scale-95 ${
                                          draft.isActive
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                            : 'border-slate-200 bg-slate-100 text-slate-500'
                                        }`}
                                      >
                                        {draft.isActive ? '활성' : '비활성'}
                                      </button>
                                    </label>
                                  </div>

                                  {/* 버튼 그룹 모바일 꽉 채우기 */}
                                  <div className="mt-5 flex flex-col sm:flex-row gap-2">
                                    <button
                                      type="button"
                                      className="w-full sm:w-auto rounded-lg md:rounded-xl bg-blue-600 px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-300"
                                      onClick={() => void handleSave(service)}
                                      disabled={busyServiceId === service.id}
                                    >
                                      {busyServiceId === service.id
                                        ? '저장 중...'
                                        : '변경 저장'}
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full sm:w-auto rounded-lg md:rounded-xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                                      onClick={() => handleResetDraft(service)}
                                    >
                                      초기화
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                  <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                                    <h4 className="text-xs md:text-sm font-bold text-slate-900">
                                      현재 운영 정보
                                    </h4>
                                    <dl className="mt-3 md:mt-4 grid gap-2.5 md:gap-3 text-[11px] md:text-sm text-slate-600">
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>등록자</dt>
                                        <dd className="font-bold text-slate-900 truncate max-w-30">
                                          {service.createdBy}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>생성일</dt>
                                        <dd className="font-bold text-slate-900">
                                          {service.createdAt}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 원래 가격</dt>
                                        <dd className="font-bold text-slate-900">
                                          {formatWon(service.originalPrice)}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 판매가</dt>
                                        <dd className="font-bold text-slate-900">
                                          {formatWon(service.monthlyPrice)}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 방장 할인율</dt>
                                        <dd className="font-bold text-slate-900">
                                          {formatRate(
                                            service.leaderDiscountRate,
                                          )}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 수수료율</dt>
                                        <dd className="font-bold text-slate-900">
                                          {formatRate(service.commissionRate)}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 빠른매칭 수수료율</dt>
                                        <dd className="font-bold text-slate-900">
                                          {formatRate(
                                            service.quickMatchFeeRate,
                                          )}
                                        </dd>
                                      </div>
                                    </dl>
                                  </div>

                                  <div className="rounded-xl md:rounded-2xl border border-blue-100 bg-blue-50/70 p-4 md:p-5 text-[11px] md:text-sm text-slate-600 shadow-sm">
                                    <p className="font-bold text-slate-900">
                                      입력 가이드
                                    </p>
                                    <ul className="mt-2.5 md:mt-3 space-y-1.5 md:space-y-2 leading-relaxed break-keep">
                                      <li>`0.10`은 10%를 뜻합니다.</li>
                                      <li>
                                        할인율에 마우스를 올리면 현재 판매가
                                        기준 할인가가 표시됩니다.
                                      </li>
                                      <li>
                                        비활성으로 전환하면 신규 파티 생성에서
                                        제외할 수 있습니다.
                                      </li>
                                      <li>
                                        판매가 변경 후 기존 파티 정산 정책은
                                        별도 검토가 필요합니다.
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-12 md:py-16 text-center text-xs md:text-sm text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
