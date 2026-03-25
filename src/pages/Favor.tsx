// ─────────────────────────────────────────────
// 외부 라이브러리 임포트
// ─────────────────────────────────────────────

import { useState } from 'react'; // React의 상태 관리 훅. 값이 바뀌면 화면을 자동으로 다시 그려줌
import { useNavigate } from 'react-router'; // SPA 방식으로 페이지 이동 (새로고침 없이 URL만 변경)
import {
  FiAlertCircle, // 신고 메뉴용 경고 아이콘
  FiCheck, // 항목 선택 체크 표시용 아이콘
  FiCompass, // 로고 및 온보딩 메뉴용 나침반 아이콘
  FiHome, // 홈 메뉴용 집 아이콘
  FiSearch, // 검색창용 돋보기 아이콘
  FiUser, // 마이페이지 메뉴용 사람 아이콘
  FiX, // 선택 항목 제거용 X 아이콘
} from 'react-icons/fi'; // 필요한 아이콘만 골라서 임포트 → 번들 사이즈 최소화 (tree-shaking)
import type { IconType } from 'react-icons'; // 아이콘 컴포넌트의 타입만 가져옴. 런타임 JS에 포함되지 않아 번들에 영향 없음
import floLogo from '../assets/FLO.png';
import waveLogo from '../assets/wave.png';
import appleOneLogo from '../assets/appleone.png';
import appletvLogo from '../assets/apple.png';
import appleMusicLogo from '../assets/applemusic.png';
import valorantLogo from '../assets/balo.jpg';
import battleGroundLogo from '../assets/battle.jpeg';
import chatGptLogo from '../assets/chatgpt.jpg';
import disneyLogo from '../assets/disney.png';
import dungeonFighterLogo from '../assets/dun.jpeg';
import duolingoLogo from '../assets/duolingo.jpeg';
import fcOnlineLogo from '../assets/fc.png';
import leagueOfLegendsLogo from '../assets/lol.jpeg';
import lostArkLogo from '../assets/lostark.png';
import lafLogo from '../assets/laf.png';
import maplestoryLogo from '../assets/maple.jpeg';
import microsoft365Logo from '../assets/microsoft 365.jpg';
import millieLogo from '../assets/mille.png';
import netflixLogo from '../assets/neflix.png';
import naverLogo from '../assets/naver.png';
import overwatch2Logo from '../assets/overwatch2.jpg';
import spotifyLogo from '../assets/spotify.png';
import snowLogo from '../assets/snow.png';
import starcraftLogo from '../assets/star.png';
import suddenAttackLogo from '../assets/sudden.png';
import tvingLogo from '../assets/tving.png';
import watchaLogo from '../assets/watcha.jpeg';

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

// 탭/카테고리 키로 사용할 수 있는 문자열을 딱 6가지로 제한. 오타 방지 + 자동완성 지원
type CategoryKey = 'all' | 'ott' | 'game' | 'education' | 'music' | 'other';

// CategoryKey에서 'all'만 제거한 타입. 'all'은 "전체 보기" UI 탭일 뿐, 실제 그룹 키로는 존재하지 않음
// Exclude<A, B> = A 타입에서 B를 뺀 타입
type InterestGroupKey = Exclude<CategoryKey, 'all'>;

// 관심사 그룹 하나의 구조 정의
type InterestGroup = {
  key: InterestGroupKey; // 그룹 식별자 ('ott' | 'game' | 'education' | 'music' | 'other')
  label: string; // 화면에 표시할 이름 ('OTT', '게임' 등)
  items: string[]; // 해당 그룹에 속한 관심사 목록 (['넷플릭스', '티빙', ...])
};

// 사이드바 네비게이션 아이템 하나의 구조 정의
type NavigationItem = {
  label: string; // 메뉴 이름 ('홈', '마이페이지' 등)
  path: string; // 이동할 URL 경로 ('/', '/mypage' 등)
  icon: IconType; // react-icons에서 가져온 아이콘 컴포넌트 (JSX로 렌더 가능해야 해서 IconType 사용)
  active?: boolean; // 현재 페이지인지 여부. '?'는 optional = 없어도 됨 (없으면 undefined = false처럼 동작)
};

type InterestAsset = {
  icon?: IconType;
  logoSrc?: string;
  accentClassName?: string;
};

// ─────────────────────────────────────────────
// 모듈 레벨 상수 (컴포넌트 밖에 선언)
// ─────────────────────────────────────────────

// localStorage에 저장할 때 사용하는 키 이름. 한 곳에서만 정의해야 오타로 인한 버그 방지
// 나중에 서버 API로 교체할 예정이라 별도 상수로 분리
const STORAGE_KEY = 'party-up:favor';

// 관심사 그룹 데이터. 컴포넌트 밖에 두는 이유: 렌더링마다 새 배열이 생성되는 낭비를 막기 위함
const INTEREST_GROUPS: InterestGroup[] = [
  // InterestGroup[] 타입을 명시해서 잘못된 데이터 구조 삽입 방지
  {
    key: 'ott', // InterestGroupKey 타입 체크 대상. 오타 시 컴파일 에러 발생
    label: 'OTT', // 탭과 카드 헤더에 표시될 이름
    items: [
      '티빙',
      '디즈니+',
      '라프텔',
      '애플TV+',
      '넷플릭스',
      '웨이브',
      '왓챠',
    ], // 선택 가능한 관심사 목록
  },
  {
    key: 'game',
    label: '게임',
    items: [
      '리그 오브 레전드',
      'FC 온라인',
      '로스트아크',
      '메이플스토리',
      '서든어택',
      '오버워치 2',
      '배틀그라운드',
      '발로란트',
      '던전앤파이터',
      '스타크래프트',
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

// 탭 버튼 렌더링에 사용할 순서 배열. INTEREST_GROUPS와 별도로 관리하는 이유: 'all' 탭이 추가로 필요하기 때문
const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: '전체' }, // 모든 그룹을 한 번에 보는 탭
  { key: 'ott', label: 'OTT' },
  { key: 'game', label: '게임' },
  { key: 'education', label: '교육' },
  { key: 'music', label: '음악' },
  { key: 'other', label: '기타' },
];

// 사이드바 네비게이션 메뉴 목록
const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: '홈', path: '/', icon: FiHome }, // 홈 화면
  { label: '마이페이지', path: '/mypage', icon: FiUser }, // 내 정보 화면
  { label: '신고', path: '/report', icon: FiAlertCircle }, // 신고 화면
  { label: '온보딩', path: '/favor', icon: FiCompass, active: true }, // 현재 페이지 (active: true → 파란 배경 표시)
];

// 모든 그룹의 items를 하나의 flat한 배열로 합침
// flatMap = map 후 1단계 펼치기. map만 쓰면 [['티빙','디즈니+'], ['리그오브레전드',...]] 같은 2차원 배열이 됨
const ALL_INTERESTS = INTEREST_GROUPS.flatMap((group) => group.items);

// 배열을 Set으로 변환. 이유:
// 1) .has()가 O(1) (배열 .includes()는 O(n) → 항목이 많을수록 느려짐)
// 2) 자동 중복 제거
// 3) localStorage에서 불러온 데이터의 유효성 검사에 사용
const ALL_INTERESTS_SET = new Set(ALL_INTERESTS);

// 관심사별 브랜드 아이콘/로고 매핑
// assets에 넣어둔 로컬 이미지를 우선 사용하고, 없는 항목만 아이콘 fallback을 씁니다.
const INTEREST_ASSETS: Record<string, InterestAsset> = {
  티빙: { logoSrc: tvingLogo },
  '디즈니+': { logoSrc: disneyLogo },
  '애플TV+': { logoSrc: appletvLogo },
  웨이브: { logoSrc: waveLogo },
  라프텔: { logoSrc: lafLogo },
  넷플릭스: { logoSrc: netflixLogo },
  왓챠: { logoSrc: watchaLogo },
  '리그 오브 레전드': { logoSrc: leagueOfLegendsLogo },
  'FC 온라인': { logoSrc: fcOnlineLogo },
  로스트아크: { logoSrc: lostArkLogo },
  메이플스토리: { logoSrc: maplestoryLogo },
  서든어택: { logoSrc: suddenAttackLogo },
  '오버워치 2': { logoSrc: overwatch2Logo },
  배틀그라운드: { logoSrc: battleGroundLogo },
  발로란트: { logoSrc: valorantLogo },
  던전앤파이터: { logoSrc: dungeonFighterLogo },
  스타크래프트: { logoSrc: starcraftLogo },
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

// ─────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────

// localStorage에서 읽어온 값이 유효한 관심사 목록인지 검증 후 필터링
// 매개변수 타입을 unknown으로 받는 이유: localStorage는 어떤 값이든 들어올 수 있음 (해커 수정, 앱 업데이트 등)
function filterSavedItems(savedItems: unknown) {
  if (!Array.isArray(savedItems)) {
    // 배열이 아니면 (null, string, object 등) 즉시 빈 배열 반환
    return [];
  }

  return savedItems.filter(
    // 타입 가드 (item): item is string → 이 조건을 통과한 item의 타입을 string으로 좁혀줌
    // 조건 1: string 타입인지 확인 (숫자, 불리언 등 제거)
    // 조건 2: 실제 관심사 목록에 존재하는 값인지 확인 (이미 삭제된 관심사나 이상한 값 제거)
    (item): item is string =>
      typeof item === 'string' && ALL_INTERESTS_SET.has(item),
  );
} // 결과: 문자열이면서 실제로 존재하는 관심사만 담긴 string[] 반환

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function Favor() {
  // export default: 이 파일의 기본 내보내기. 다른 파일에서 import Favor from './Favor'로 사용
  const navigate = useNavigate(); // useNavigate()가 반환한 이동 함수를 변수에 저장. navigate('/') 형태로 호출

  // ── State 선언 ──────────────────────────────

  // 현재 활성화된 카테고리 탭. 기본값 'all' (전체 보기)
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  // 사용자가 선택한 관심사 항목 목록
  const [selectedItems, setSelectedItems] = useState<string[]>(() => {
    // () => ... 형태의 lazy initializer: useState에 함수를 넘기면 최초 렌더링 1회만 실행됨
    // 일반값으로 넘기면 (useState(localStorage.getItem(...))) 렌더링마다 실행되어 낭비 발생

    if (typeof window === 'undefined') {
      // SSR(서버사이드 렌더링) 환경에서는 window/localStorage가 없음
      return []; // 서버에서 실행될 때 에러 방지를 위해 빈 배열 반환
    }

    try {
      // localStorage 접근은 시크릿 모드나 용량 초과 시 에러를 던질 수 있으므로 try/catch로 감쌈
      const stored = localStorage.getItem(STORAGE_KEY); // localStorage에서 저장된 값 읽기 (없으면 null 반환)

      if (!stored) {
        // null이거나 빈 문자열이면 (저장된 데이터 없음)
        return []; // 초기 선택값 없음
      }

      return filterSavedItems(JSON.parse(stored)); // JSON 문자열 → 배열로 파싱 후 유효한 값만 필터링해서 초기값으로 사용
    } catch {
      return []; // JSON.parse 실패 or localStorage 에러 시 안전하게 빈 배열로 초기화
    }
  });

  // 검색창 입력값. controlled input 패턴 → React가 input의 value를 완전히 제어
  const [query, setQuery] = useState('');

  // ── 렌더링마다 계산되는 파생 값들 ─────────────

  // selectedItems 배열을 Set으로 변환. 이유: 아래 .has() 호출이 수십 번 반복되는데 O(1)이 O(n)보다 빠름
  const selectedLookup = new Set(selectedItems);

  // 검색어 정규화: 앞뒤 공백 제거 + 소문자 변환 → '넷플릭스'와 ' 넷플릭스 '가 같게 취급됨
  const normalizedQuery = query.trim().toLowerCase();

  // 현재 선택된 항목 수. 하단 바 "선택됨: N개" 표시 및 버튼 disabled 조건에 사용
  const totalSelected = selectedItems.length;

  // 각 탭에 표시할 선택 개수 계산. reduce로 한 번 순회해서 { all: 3, ott: 1, game: 2, ... } 형태로 만듦
  const tabCounts = INTEREST_GROUPS.reduce<Record<CategoryKey, number>>( // Record<K, V> = K 키를 가진 객체 타입
    (counts, group) => {
      // counts: 누산기 객체, group: 현재 순회 중인 그룹
      // 현재 그룹에서 선택된 항목 수를 계산해서 해당 키에 저장
      counts[group.key] = group.items.filter((item) =>
        selectedLookup.has(item),
      ).length;
      counts.all += counts[group.key]; // 'all' 탭 카운트에 누적
      return counts; // 다음 순회를 위해 누산기 반환 (reduce의 필수 패턴)
    },
    { all: 0, ott: 0, game: 0, education: 0, music: 0, other: 0 }, // 초기 누산기 값 (모든 카테고리 0으로 시작)
  );

  // 현재 탭과 검색어에 맞는 그룹+항목 목록 계산
  const visibleGroups = INTEREST_GROUPS.filter((group) => {
    // 1단계: 탭 기준으로 그룹 자체를 필터
    if (activeCategory === 'all') {
      return true; // 'all' 탭이면 모든 그룹 표시
    }
    return group.key === activeCategory; // 특정 탭이면 해당 그룹만
  }).map((group) => ({
    // 2단계: 각 그룹 내 항목을 검색어로 필터
    ...group, // 기존 group의 모든 속성(key, label, items)을 복사 (스프레드 연산자)
    visibleItems: group.items.filter((item) => {
      // 화면에 실제로 보여줄 항목만 담은 새 배열
      if (!normalizedQuery) {
        // 검색어 없으면 전체 표시
        return true;
      }
      return item.toLowerCase().includes(normalizedQuery); // 항목 이름에 검색어 포함 여부 확인
    }),
  }));

  // 검색 결과가 하나라도 있는지 확인. false면 "검색 결과 없음" UI 표시
  // .some()은 조건을 만족하는 첫 원소를 찾는 순간 순회를 멈춤 (find처럼 단락 평가)
  const hasResults = visibleGroups.some(
    (group) => group.visibleItems.length > 0,
  );

  // ── 이벤트 핸들러 ────────────────────────────

  // 단일 항목 선택/해제 토글
  const toggleItem = (item: string) => {
    setSelectedItems((current) => {
      // 함수형 업데이트: current는 항상 최신 상태값 보장 (클로저 문제 방지)
      if (current.includes(item)) {
        // 이미 선택된 항목이면
        return current.filter((selected) => selected !== item); // 해당 항목만 제외한 새 배열 반환 (원본 불변)
      }
      return [...current, item]; // 선택 안 된 항목이면 끝에 추가. 스프레드로 새 배열 생성 (원본 불변)
      // 원본 불변이 중요한 이유: push로 직접 수정하면 React가 변경을 감지 못해 리렌더링 안 됨
    });
  };

  // 그룹 전체 선택/해제 토글 ('전체 선택' 버튼)
  const toggleGroupItems = (items: string[]) => {
    if (items.length === 0) {
      // 표시되는 항목이 없으면 (검색 결과 없을 때) 아무것도 안 함
      return;
    }

    setSelectedItems((current) => {
      // 현재 보이는 항목(visibleItems)이 모두 선택됐는지 확인
      // .every()는 모든 원소가 조건을 만족할 때 true. 하나라도 아니면 false
      const hasEveryItem = items.every((item) => current.includes(item));

      if (hasEveryItem) {
        // 모두 선택된 상태라면 → 전체 해제
        return current.filter((item) => !items.includes(item)); // 이 그룹 항목들만 제외
      }

      const next = [...current]; // 현재 선택 목록 복사 (원본 불변 원칙)

      items.forEach((item) => {
        // 그룹의 각 항목에 대해
        if (!next.includes(item)) {
          // 아직 선택 안 된 항목만
          next.push(item); // 추가 (중복 방지)
        }
      });

      return next; // 기존 선택 + 새로 추가된 항목이 합쳐진 배열 반환
    });
  };

  // 모든 선택 초기화
  const resetSelection = () => setSelectedItems([]); // 빈 배열로 교체 → React가 감지 후 리렌더링

  // 선택 저장 후 홈으로 이동
  const saveSelection = () => {
    if (selectedItems.length === 0) {
      // 선택된 항목이 없으면 저장 불필요
      return;
    }

    try {
      // localStorage는 문자열만 저장 가능 → 배열을 JSON 문자열로 직렬화
      // 읽을 때는 반대로 JSON.parse로 역직렬화
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedItems));
    } catch {
      return; // 저장 실패 시 (시크릿 모드, 용량 초과 등) 페이지 이동하지 않음
    }

    navigate('/'); // 저장 성공 후에만 홈으로 이동
  };

  // 저장 없이 홈으로 이동 ('나중에' 버튼)
  const moveToHome = () => navigate('/');

  // ── JSX 렌더링 ──────────────────────────────

  return (
    // 전체 페이지 래퍼. radial-gradient로 위쪽에 연한 파란색 그라디언트 배경
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_38%,_#ffffff_72%)] text-slate-900"
      style={{
        // Tailwind에 없는 폰트 스택을 인라인 스타일로 직접 지정
        // 앞쪽 폰트부터 순서대로 시도하고, 없으면 다음 폰트로 fallback
        fontFamily:
          '"Pretendard Variable", "SUIT Variable", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }}
    >
      {/* 최대 너비 1680px, 모바일은 세로 배치(flex-col), 데스크탑(lg)은 가로 배치(flex-row) */}
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col lg:flex-row">
        {/* ── 사이드바 ── */}
        {/* 모바일: 아래 테두리(border-b), 데스크탑: 오른쪽 테두리(border-r) + 고정 너비 300px */}
        <aside className="border-b border-slate-200/80 bg-white/90 px-5 py-6 backdrop-blur lg:w-[300px] lg:border-b-0 lg:border-r">
          {/* 로고 버튼: 클릭 시 홈으로 이동 */}
          <button
            type="button" // form 안에 있을 때 submit 방지용 명시 (습관적으로 쓰는 게 좋음)
            onClick={moveToHome}
            className="flex items-center gap-3 rounded-2xl px-2 py-1 text-left"
          >
            {/* 나침반 아이콘 배경 박스 */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)]">
              <FiCompass className="h-5 w-5" />{' '}
              {/* 아이콘 컴포넌트는 JSX로 바로 사용 가능 */}
            </div>
            <div>
              {/* 서비스 이름 */}
              <p className="text-[2rem] font-black tracking-[-0.03em] text-slate-900">
                Party-Up
              </p>
            </div>
          </button>

          {/* 네비게이션 메뉴 목록 */}
          <nav className="mt-12 flex flex-col gap-3">
            {NAVIGATION_ITEMS.map(({ label, path, icon: Icon, active }) => (
              // icon을 구조분해할 때 Icon으로 별칭. 소문자 icon은 JSX 태그로 쓸 수 없음 (소문자 = HTML 태그 취급)
              <button
                key={label} // React 리스트 렌더링 필수: 각 아이템을 구별하는 고유 키
                type="button"
                onClick={() => navigate(path)} // 클릭 시 해당 경로로 이동
                className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-semibold transition ${
                  active
                    ? 'bg-blue-100 text-blue-600 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]' // 현재 페이지: 파란 배경
                    : 'text-slate-700 hover:bg-slate-100' // 다른 페이지: 기본 스타일
                }`}
              >
                <Icon className="h-4 w-4" />{' '}
                {/* 아이콘 컴포넌트를 변수처럼 JSX 태그로 사용 */}
                <span>{label}</span> {/* 메뉴 이름 텍스트 */}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── 메인 콘텐츠 영역 ── */}
        {/* flex-1: 사이드바를 제외한 나머지 너비를 모두 차지 */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* 상단 검색바 */}
          <header className="border-b border-slate-200/80 bg-white/75 px-4 py-4 backdrop-blur md:px-8">
            {/* label 태그로 감싸면 클릭 시 내부 input에 포커스 자동 이동 */}
            <label className="mx-auto flex max-w-[920px] items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
              <FiSearch className="h-5 w-5 text-slate-400" />{' '}
              {/* 돋보기 아이콘 */}
              <input
                value={query} // controlled input: state가 input의 값을 제어
                onChange={(event) => setQuery(event.target.value)} // 입력마다 state 업데이트 → 리렌더링 → 검색 결과 갱신
                placeholder="검색..."
                className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </header>

          {/* 콘텐츠 본문 */}
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">
            {/* 메인 카드 영역 */}
            <section className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              {/* 카드 헤더: 제목 + 액션 버튼들 */}
              <div className="flex flex-col gap-5 border-b border-slate-200/80 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
                <div>
                  <p className="text-[2rem] font-black tracking-[-0.04em] text-slate-900">
                    회원가입 완료 <span aria-hidden="true">🎉</span>
                    {/* aria-hidden="true": 이모지는 스크린리더에서 읽히면 어색하므로 보조기술에서 숨김 */}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    바로 관심사를 선택해 주세요. 선택한 관심사는 추천 파티에
                    반영돼요.
                  </p>
                </div>

                {/* 헤더 우측 버튼 그룹 */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* 초기화 버튼: 선택된 항목이 없으면 disabled */}
                  <button
                    type="button"
                    onClick={resetSelection}
                    disabled={totalSelected === 0} // 0개면 비활성화. HTML disabled 속성이 클릭 이벤트도 차단
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                    // disabled: 접두사: disabled 상태일 때 Tailwind 스타일 적용 (커서 금지 + 투명도 낮춤)
                  >
                    초기화
                  </button>
                  {/* 나중에 버튼: 저장 없이 홈으로 */}
                  <button
                    type="button"
                    onClick={moveToHome}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    나중에
                  </button>
                  {/* 저장 버튼: 선택 없으면 disabled + 회색으로 변경 */}
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

              {/* 카드 본문 */}
              <div className="space-y-6 px-6 py-6 lg:px-8 lg:py-8">
                {/* 환영 배너 */}
                <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,_rgba(239,246,255,0.95),_rgba(248,250,252,0.9))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* 체크 아이콘 박스 */}
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

                {/* 카테고리 탭 버튼 목록 */}
                <div className="flex flex-wrap gap-3">
                  {CATEGORY_TABS.map(({ key, label }) => {
                    // 탭 데이터 배열을 순회하며 버튼 렌더링
                    const isActive = activeCategory === key; // 현재 탭인지 여부
                    const count = tabCounts[key]; // 해당 탭의 선택 개수

                    return (
                      <button
                        key={key} // 리스트 렌더링 고유 키
                        type="button"
                        onClick={() => setActiveCategory(key)} // 탭 클릭 시 state 변경 → 리렌더링 → visibleGroups 재계산
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold transition ${
                          isActive
                            ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-[0_10px_30px_rgba(59,130,246,0.12)]' // 활성 탭
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50' // 비활성 탭
                        }`}
                      >
                        <span>{label}</span> {/* 탭 이름 */}
                        {/* 선택 개수 뱃지 */}
                        <span
                          className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-extrabold ${
                            isActive
                              ? 'bg-white text-blue-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count} {/* tabCounts에서 계산한 선택 개수 */}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 검색 결과 유무에 따라 분기 */}
                {hasResults ? (
                  // 결과 있음: 그룹 카드 그리드
                  // 'all' 탭이면 2열(xl 이상), 특정 탭이면 1열
                  <div
                    className={`grid gap-4 ${
                      activeCategory === 'all'
                        ? 'grid-cols-1 xl:grid-cols-2'
                        : 'grid-cols-1'
                    }`}
                  >
                    {visibleGroups.map((group) => {
                      // 현재 그룹에서 실제 선택된 항목 수 (visibleItems 기준 아닌 items 전체 기준)
                      const groupSelectedCount = group.items.filter((item) =>
                        selectedLookup.has(item),
                      ).length;

                      // 현재 보이는 항목(visibleItems)이 모두 선택됐는지 여부 → '전체 선택/해제' 버튼 텍스트 결정
                      const allVisibleItemsSelected =
                        group.visibleItems.length > 0 && // 보이는 항목이 하나라도 있어야 함 (빈 배열의 every는 항상 true)
                        group.visibleItems.every((item) =>
                          selectedLookup.has(item),
                        ); // 전부 선택됐는지

                      return (
                        // article: 의미론적 태그. 독립적인 콘텐츠 단위임을 명시 (SEO + 접근성)
                        <article
                          key={group.key} // 그룹 키를 리스트 key로 사용
                          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
                        >
                          {/* 그룹 헤더: 이름 + 선택 수 뱃지 + 전체 선택 버튼 */}
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-3">
                              {/* h2: 카드 제목 (시맨틱 헤딩, 스크린리더가 문서 구조를 이해하는 데 도움) */}
                              <h2 className="text-[1.9rem] font-black tracking-[-0.04em] text-slate-900">
                                {group.label}
                              </h2>
                              {/* 그룹 내 선택 개수 뱃지 */}
                              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-600">
                                선택 {groupSelectedCount}
                              </span>
                            </div>

                            {/* 전체 선택/해제 버튼 */}
                            <button
                              type="button"
                              onClick={() =>
                                toggleGroupItems(group.visibleItems)
                              } // 현재 보이는 항목만 대상
                              disabled={group.visibleItems.length === 0} // 검색 결과 없을 때 비활성
                              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {allVisibleItemsSelected
                                ? '전체 해제'
                                : '전체 선택'}{' '}
                              {/* 상태에 따라 텍스트 변경 */}
                            </button>
                          </div>

                          {/* 관심사 항목 버튼 목록 */}
                          <div className="mt-5 flex flex-wrap gap-3">
                            {group.visibleItems.map((item) => {
                              const isSelected = selectedLookup.has(item); // O(1) 선택 여부 확인
                              const asset = INTEREST_ASSETS[item];
                              const AssetIcon = asset?.icon;

                              return (
                                <button
                                  key={item} // 항목 이름을 key로 사용 (그룹 내 유일)
                                  type="button"
                                  onClick={() => toggleItem(item)} // 클릭 시 선택/해제 토글
                                  aria-pressed={isSelected} // 접근성: 스크린리더에 "눌린 상태"임을 알림 (토글 버튼 의미론)
                                  className={`inline-flex min-h-12 items-center gap-3 rounded-full border px-4 py-3 text-left text-sm font-bold transition ${
                                    isSelected
                                      ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-[0_12px_24px_rgba(59,130,246,0.12)]' // 선택됨
                                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50' // 미선택
                                  }`}
                                >
                                  {/* 체크 인디케이터 원형 아이콘 */}
                                  <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[0.7rem] ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-600 text-white' // 선택됨: 파란 원 + 흰 체크
                                        : 'border-slate-300 bg-white text-transparent' // 미선택: 흰 원 + 투명 체크 (자리 유지용)
                                    }`}
                                  >
                                    <FiCheck className="h-3.5 w-3.5" />
                                  </span>
                                  {/* 관심사별 브랜드 아이콘/로고 */}
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
                                  <span>{item}</span> {/* 관심사 이름 */}
                                </button>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  // 결과 없음: 안내 메시지
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

              {/* ── 하단 푸터 바 ── */}
              <div className="border-t border-slate-200/80 bg-slate-50/70 px-6 py-5 lg:px-8">
                {/* 선택 개수 정보 + 버튼 행 */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    {/* 현재 선택된 개수 표시 */}
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
                      선택 완료 후 홈 화면으로 이동하면, 고른 관심사의 파티를
                      먼저 추천해요.
                    </p>
                  </div>

                  {/* 하단 버튼 그룹 (헤더와 동일한 기능, UX 편의를 위해 아래에도 배치) */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={moveToHome} // 저장 없이 홈으로
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      홈으로
                    </button>
                    <button
                      type="button"
                      onClick={saveSelection} // 저장 후 홈으로
                      disabled={totalSelected === 0}
                      className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      저장하고 계속
                    </button>
                  </div>
                </div>

                {/* 선택된 항목 태그 목록 (클릭하면 개별 해제) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedItems.length > 0 ? (
                    selectedItems.map((item) => {
                      // 선택된 항목을 태그 형태로 나열
                      const asset = INTEREST_ASSETS[item];
                      const AssetIcon = asset?.icon;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleItem(item)} // 태그 클릭 시 선택 해제
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
                          <FiX className="h-3.5 w-3.5 text-slate-400" />{' '}
                          {/* X 아이콘: 제거 가능함을 시각적으로 표시 */}
                        </button>
                      );
                    })
                  ) : (
                    // 선택 없을 때 안내 문구
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
    </div>
  );
}
