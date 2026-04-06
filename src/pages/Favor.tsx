import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FiCheck, FiSearch, FiX } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import floLogo from '../assets/FLO.png';
import waveLogo from '../assets/wave.png';
import appleOneLogo from '../assets/appleone.png';
import appletvLogo from '../assets/apple.png';
import appleMusicLogo from '../assets/applemusic.png';
import chatGptLogo from '../assets/chatgpt.jpg';
import disneyLogo from '../assets/disney.png';
import duolingoLogo from '../assets/duolingo.jpeg';
import lafLogo from '../assets/laf.png';
import microsoft365Logo from '../assets/microsoft 365.jpg';
import millieLogo from '../assets/mille.png';
import netflixLogo from '../assets/neflix.png';
import naverLogo from '../assets/naver.png';
import spotifyLogo from '../assets/spotify.png';
import snowLogo from '../assets/snow.png';
import tvingLogo from '../assets/tving.png';
import watchaLogo from '../assets/watcha.jpeg';

type CategoryKey = 'all' | 'ott' | 'education' | 'music' | 'other';
type InterestGroupKey = Exclude<CategoryKey, 'all'>;

type InterestGroup = {
  key: InterestGroupKey;
  label: string;
  items: string[];
};

type InterestAsset = {
  icon?: IconType;
  logoSrc?: string;
  accentClassName?: string;
};

const STORAGE_KEY = 'party-up:favor';

const INTEREST_GROUPS: InterestGroup[] = [
  {
    key: 'ott',
    label: 'OTT',
    items: [
      '티빙',
      '디즈니+',
      '라프텔',
      '애플TV+',
      '넷플릭스',
      '웨이브',
      '왓챠',
    ],
  },
  {
    key: 'education',
    label: '교육',
    items: ['슈퍼 듀오링고', '밀리의서재'],
  },
  {
    key: 'music',
    label: '음악',
    items: ['스포티파이 프리미엄', '애플뮤직', 'FLO'],
  },
  {
    key: 'other',
    label: '기타',
    items: [
      '네이버플러스',
      '애플ONE',
      '스노우VIP',
      'ChatGPT',
      '마이크로소프트365',
    ],
  },
];

const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'ott', label: 'OTT' },
  { key: 'education', label: '교육' },
  { key: 'music', label: '음악' },
  { key: 'other', label: '기타' },
];

const ALL_INTERESTS = INTEREST_GROUPS.flatMap((group) => group.items);
const ALL_INTERESTS_SET = new Set(ALL_INTERESTS);

const INTEREST_ASSETS: Record<string, InterestAsset> = {
  티빙: { logoSrc: tvingLogo },
  '디즈니+': { logoSrc: disneyLogo },
  '애플TV+': { logoSrc: appletvLogo },
  웨이브: { logoSrc: waveLogo },
  라프텔: { logoSrc: lafLogo },
  넷플릭스: { logoSrc: netflixLogo },
  왓챠: { logoSrc: watchaLogo },
  '슈퍼 듀오링고': { logoSrc: duolingoLogo },
  밀리의서재: { logoSrc: millieLogo },
  '스포티파이 프리미엄': { logoSrc: spotifyLogo },
  애플뮤직: { logoSrc: appleMusicLogo },
  FLO: { logoSrc: floLogo },
  네이버플러스: { logoSrc: naverLogo },
  애플ONE: { logoSrc: appleOneLogo },
  ChatGPT: { logoSrc: chatGptLogo },
  스노우VIP: { logoSrc: snowLogo },
  마이크로소프트365: { logoSrc: microsoft365Logo },
};

function filterSavedItems(savedItems: unknown) {
  if (!Array.isArray(savedItems)) {
    return [];
  }

  return savedItems.filter(
    (item): item is string =>
      typeof item === 'string' && ALL_INTERESTS_SET.has(item),
  );
}

export default function Favor() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  const [selectedItems, setSelectedItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return [];
      }

      return filterSavedItems(JSON.parse(stored));
    } catch {
      return [];
    }
  });

  const [query, setQuery] = useState('');

  const selectedLookup = new Set(selectedItems);
  const normalizedQuery = query.trim().toLowerCase();
  const totalSelected = selectedItems.length;

  const tabCounts = INTEREST_GROUPS.reduce<Record<CategoryKey, number>>(
    (counts, group) => {
      counts[group.key] = group.items.filter((item) =>
        selectedLookup.has(item),
      ).length;
      counts.all += counts[group.key];
      return counts;
    },
    { all: 0, ott: 0, education: 0, music: 0, other: 0 },
  );

  const visibleGroups = INTEREST_GROUPS.filter((group) => {
    if (activeCategory === 'all') {
      return true;
    }
    return group.key === activeCategory;
  }).map((group) => ({
    ...group,
    visibleItems: group.items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }
      return item.toLowerCase().includes(normalizedQuery);
    }),
  }));

  const hasResults = visibleGroups.some(
    (group) => group.visibleItems.length > 0,
  );

  const toggleItem = (item: string) => {
    setSelectedItems((current) => {
      if (current.includes(item)) {
        return current.filter((selected) => selected !== item);
      }
      return [...current, item];
    });
  };

  const toggleGroupItems = (items: string[]) => {
    if (items.length === 0) {
      return;
    }

    setSelectedItems((current) => {
      const hasEveryItem = items.every((item) => current.includes(item));

      if (hasEveryItem) {
        return current.filter((item) => !items.includes(item));
      }

      const next = [...current];

      items.forEach((item) => {
        if (!next.includes(item)) {
          next.push(item);
        }
      });

      return next;
    });
  };

  const resetSelection = () => setSelectedItems([]);

  const saveSelection = () => {
    if (selectedItems.length === 0) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedItems));
    } catch {
      return;
    }

    navigate('/home');
  };

  const moveToHome = () => navigate('/home');

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_38%,_#ffffff_72%)] text-slate-900"
      style={{
        fontFamily:
          '"Pretendard Variable", "SUIT Variable", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }}
    >
      <div className="mx-auto min-h-screen w-full max-w-[1100px] px-4 py-6 md:px-8 md:py-8 lg:px-10">
        <main>
          <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-5 border-b border-slate-200/80 px-6 py-6 lg:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[2rem] font-black tracking-[-0.04em] text-slate-900">
                    회원가입 완료 <span aria-hidden="true">🎉</span>
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    바로 관심사를 선택해 주세요. 선택한 관심사는 추천 파티에
                    반영돼요.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={resetSelection}
                    disabled={totalSelected === 0}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    onClick={moveToHome}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    나중에
                  </button>
                  <button
                    type="button"
                    onClick={saveSelection}
                    disabled={totalSelected === 0}
                    className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    저장
                  </button>
                </div>
              </div>

              <label className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
                <FiSearch className="h-5 w-5 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="검색..."
                  className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
              <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,_rgba(239,246,255,0.95),_rgba(248,250,252,0.9))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]">
                    <FiCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold tracking-[-0.03em] text-slate-900">
                      환영해요! 관심사만 고르면 준비 끝.
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      복수 선택 가능 · 최대 제한 없음
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {CATEGORY_TABS.map(({ key, label }) => {
                  const isActive = activeCategory === key;
                  const count = tabCounts[key];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold transition ${
                        isActive
                          ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-[0_10px_30px_rgba(59,130,246,0.12)]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-extrabold ${
                          isActive
                            ? 'bg-white text-blue-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {hasResults ? (
                <div
                  className={`grid gap-4 ${
                    activeCategory === 'all'
                      ? 'grid-cols-1 xl:grid-cols-2'
                      : 'grid-cols-1'
                  }`}
                >
                  {visibleGroups.map((group) => {
                    const groupSelectedCount = group.items.filter((item) =>
                      selectedLookup.has(item),
                    ).length;

                    const allVisibleItemsSelected =
                      group.visibleItems.length > 0 &&
                      group.visibleItems.every((item) =>
                        selectedLookup.has(item),
                      );

                    return (
                      <article
                        key={group.key}
                        className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-3">
                            <h2 className="text-[1.9rem] font-black tracking-[-0.04em] text-slate-900">
                              {group.label}
                            </h2>
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-600">
                              선택 {groupSelectedCount}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleGroupItems(group.visibleItems)}
                            disabled={group.visibleItems.length === 0}
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {allVisibleItemsSelected
                              ? '전체 해제'
                              : '전체 선택'}
                          </button>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          {group.visibleItems.map((item) => {
                            const isSelected = selectedLookup.has(item);
                            const asset = INTEREST_ASSETS[item];
                            const AssetIcon = asset?.icon;

                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleItem(item)}
                                aria-pressed={isSelected}
                                className={`inline-flex min-h-12 items-center gap-3 rounded-full border px-4 py-3 text-left text-sm font-bold transition ${
                                  isSelected
                                    ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-[0_12px_24px_rgba(59,130,246,0.12)]'
                                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[0.7rem] ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-slate-300 bg-white text-transparent'
                                  }`}
                                >
                                  <FiCheck className="h-3.5 w-3.5" />
                                </span>

                                <span
                                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border ${
                                    isSelected
                                      ? 'border-blue-100 bg-white'
                                      : 'border-slate-200 bg-slate-50'
                                  }`}
                                >
                                  {AssetIcon ? (
                                    <AssetIcon
                                      className={`h-4.5 w-4.5 ${asset?.accentClassName ?? 'text-slate-600'}`}
                                    />
                                  ) : (
                                    <>
                                      <span className="text-[0.65rem] font-black text-slate-400">
                                        {item.slice(0, 1)}
                                      </span>
                                      {asset?.logoSrc ? (
                                        <img
                                          src={asset.logoSrc}
                                          alt=""
                                          aria-hidden="true"
                                          loading="lazy"
                                          className="absolute h-5 w-5 rounded object-contain"
                                        />
                                      ) : null}
                                    </>
                                  )}
                                </span>

                                <span>{item}</span>
                              </button>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <p className="text-lg font-extrabold tracking-[-0.03em] text-slate-800">
                    검색 결과가 없어요.
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    다른 키워드로 다시 검색하거나 카테고리를 바꿔 보세요.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/80 bg-slate-50/70 px-6 py-5 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    선택됨:{' '}
                    <span className="text-xl font-black text-slate-900">
                      {totalSelected}
                    </span>
                    <span className="ml-2">
                      개 · 저장 후 계속 진행할 수 있어요.
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    선택 완료 후 홈 화면으로 이동하면, 고른 관심사의 파티를 먼저
                    추천해요.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* <button
                    type="button"
                    onClick={moveToHome}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    홈으로
                  </button> */}
                  {/* <button
                    type="button"
                    onClick={saveSelection}
                    disabled={totalSelected === 0}
                    className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    저장하고 계속
                  </button> */}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => {
                    const asset = INTEREST_ASSETS[item];
                    const AssetIcon = asset?.icon;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(item)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-50">
                          {AssetIcon ? (
                            <AssetIcon
                              className={`h-3.5 w-3.5 ${asset?.accentClassName ?? 'text-slate-600'}`}
                            />
                          ) : (
                            <>
                              <span className="text-[0.55rem] font-black text-slate-400">
                                {item.slice(0, 1)}
                              </span>
                              {asset?.logoSrc ? (
                                <img
                                  src={asset.logoSrc}
                                  alt=""
                                  aria-hidden="true"
                                  loading="lazy"
                                  className="absolute h-3.5 w-3.5 rounded object-contain"
                                />
                              ) : null}
                            </>
                          )}
                        </span>
                        <span>{item}</span>
                        <FiX className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm font-medium text-slate-400">
                    아직 선택된 관심사가 없어요. 원하는 항목을 자유롭게 골라
                    보세요.
                  </p>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
