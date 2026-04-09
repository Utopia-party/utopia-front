import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminServices,
  getAdminErrorMessage,
  updateAdminService,
  type AdminServiceRecord,
  type AdminServiceUpdatePayload,
} from '../../apis/admin';

const STATUS_STYLE: Record<string, string> = {
  활성: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  비활성: 'bg-slate-100 text-slate-600 border-slate-200',
};

const MAX_SERVICE_PRICE = 2_147_483_647;

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;
const formatRate = (value: number) => `${Math.round(value * 100)}%`;
const getLogoSrc = (service: AdminServiceRecord) =>
  service.logoImageUrl || null;
const getDiscountedPrice = (price: number, discountRate: number) =>
  Math.round(price * (1 - discountRate));

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

function DiscountHoverValue({
  rate,
  discountedPrice,
}: {
  rate: number;
  discountedPrice: number;
}) {
  return (
    <span className="inline-flex min-w-[92px]">
      <span className="group relative inline-flex cursor-help flex-col items-start">
        <span className="underline decoration-dotted underline-offset-4">
          {formatRate(rate)}
        </span>
        <span className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block">
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
});

export default function AdminServices() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('전체');
  const [services, setServices] = useState<AdminServiceRecord[]>([]);
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
      return {
        ...prev,
        [serviceId]: {
          ...current,
          [key]: value,
        },
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
    <>
      <AdminHeader
        placeholder="서비스 검색 (ID/이름/카테고리)..."
        onSearch={setSearch}
        rightContent={
          <span className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600">
            서비스 가격/수수료 관리
          </span>
        }
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">
              구독 서비스 관리
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              서비스별 원래 가격, 월 판매가, 할인율과 활성 상태를 토글형
              편집으로 관리합니다.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
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

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
              서비스 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      서비스
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      카테고리
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      최대 인원
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      원래 가격
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      판매가
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      수수료
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      방장 할인
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      추천 할인
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
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
                          <td className="px-4 py-3.5 text-sm text-gray-700">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                {getLogoSrc(service) ? (
                                  <img
                                    src={getLogoSrc(service)!}
                                    alt={service.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">
                                    NO
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {service.name}
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                  {service.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {service.category}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {service.maxMembers}명
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {formatWon(service.originalPrice)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {formatWon(service.monthlyPrice)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {formatRate(service.commissionRate)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <DiscountHoverValue
                              rate={service.leaderDiscountRate}
                              discountedPrice={getDiscountedPrice(
                                service.monthlyPrice,
                                service.leaderDiscountRate,
                              )}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <DiscountHoverValue
                              rate={service.referralDiscountRate}
                              discountedPrice={getDiscountedPrice(
                                service.monthlyPrice,
                                service.referralDiscountRate,
                              )}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[statusLabel]}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <button
                              className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                                isExpanded
                                  ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                              onClick={() => handleToggleDetail(service)}
                            >
                              {isExpanded ? '닫기' : '가격 수정'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={10} className="px-4 py-4">
                              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                        {getLogoSrc(service) ? (
                                          <img
                                            src={getLogoSrc(service)!}
                                            alt={service.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-xs font-bold text-slate-400">
                                            NO IMAGE
                                          </span>
                                        )}
                                      </div>
                                      <h3 className="text-base font-semibold text-slate-900">
                                        {service.name} 설정 편집
                                      </h3>
                                      <div>
                                        <p className="mt-1 text-sm text-slate-500">
                                          가격과 할인율을 수정하면 즉시 관리자
                                          API에 반영됩니다.
                                        </p>
                                      </div>
                                    </div>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                                      최근 수정 {service.updatedAt}
                                    </span>
                                  </div>

                                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <label className="flex flex-col gap-2">
                                      <span className="text-sm font-medium text-slate-700">
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
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                      <span className="text-sm font-medium text-slate-700">
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
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                      <span className="text-sm font-medium text-slate-700">
                                        판매가(월)
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={MAX_SERVICE_PRICE}
                                        step={1}
                                        value={draft.monthlyPrice}
                                        onChange={(event) =>
                                          handleDraftChange(
                                            service.id,
                                            'monthlyPrice',
                                            Number(event.target.value),
                                          )
                                        }
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                      <span className="text-sm font-medium text-slate-700">
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
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                      <span className="text-sm font-medium text-slate-700">
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
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
                                      <span className="text-sm font-medium text-slate-700">
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
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                      <span className="text-sm font-medium text-slate-700">
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
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                      <span className="text-sm font-medium text-slate-700">
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
                                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                          draft.isActive
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                            : 'border-slate-200 bg-slate-100 text-slate-500'
                                        }`}
                                      >
                                        {draft.isActive ? '활성' : '비활성'}
                                      </button>
                                    </label>
                                  </div>

                                  <div className="mt-5 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
                                      onClick={() => void handleSave(service)}
                                      disabled={busyServiceId === service.id}
                                    >
                                      {busyServiceId === service.id
                                        ? '저장 중...'
                                        : '변경 저장'}
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                      onClick={() => handleResetDraft(service)}
                                    >
                                      초기화
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h4 className="text-sm font-semibold text-slate-900">
                                      현재 운영 정보
                                    </h4>
                                    <dl className="mt-4 grid gap-3 text-sm text-slate-600">
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>등록자</dt>
                                        <dd className="font-medium text-slate-900">
                                          {service.createdBy}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>생성일</dt>
                                        <dd className="font-medium text-slate-900">
                                          {service.createdAt}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 원래 가격</dt>
                                        <dd className="font-medium text-slate-900">
                                          {formatWon(service.originalPrice)}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 판매가</dt>
                                        <dd className="font-medium text-slate-900">
                                          {formatWon(service.monthlyPrice)}
                                        </dd>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <dt>현재 수수료율</dt>
                                        <dd className="font-medium text-slate-900">
                                          {formatRate(service.commissionRate)}
                                        </dd>
                                      </div>
                                    </dl>
                                  </div>

                                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-sm text-slate-600 shadow-sm">
                                    <p className="font-semibold text-slate-900">
                                      입력 가이드
                                    </p>
                                    <ul className="mt-3 space-y-2 leading-6">
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
                        colSpan={10}
                        className="px-4 py-16 text-center text-sm text-gray-400"
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
    </>
  );
}
