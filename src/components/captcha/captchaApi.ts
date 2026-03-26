/**
 * Captcha API 서비스
 * 실제 백엔드 연동 전까지 Mock 응답 사용
 * CONTEXT.md Section 11 — 엔드포인트 설계 기반
 */
import type { BehaviorPayload } from './useBehaviorCollector';
import type {
  CaptchaInitResponse,
  CaptchaChallengeResponse,
  CaptchaVerifyResponse,
} from './types';

// ── 설정 ───────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const USE_MOCK = import.meta.env.VITE_CAPTCHA_MOCK !== 'false'; // 기본: mock 사용

// ── Mock 이미지 데이터 ─────────────────────────────
// 실제로는 MinIO에서 GAN 생성 이모지 + 실제 동물 사진을 가져옴
// 목업에서는 placeholder 이미지 사용

const ANIMAL_CATEGORIES = ['cat', 'dog', 'bear', 'fox', 'penguin'] as const;
const ANIMAL_LABELS: Record<string, string> = {
  cat: '고양이',
  dog: '강아지',
  bear: '곰',
  fox: '여우',
  penguin: '펭귄',
};

// emoji placeholder (실제로는 FastGAN 생성 이미지)
function generateMockEmojis() {
  // 랜덤으로 3개 카테고리 선택
  const shuffled = [...ANIMAL_CATEGORIES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  return selected.map((cat, i) => ({
    id: `emoji-${cat}-${i}`,
    url: `https://placehold.co/80x80/FFD93D/333?text=${ANIMAL_LABELS[cat]}`,
    category: cat,
  }));
}

// photo grid placeholder (실제로는 MinIO captcha-photos 버킷)
function generateMockPhotos(emojis: ReturnType<typeof generateMockEmojis>) {
  const correctCategories = emojis.map((e) => e.category);
  const otherCategories = ANIMAL_CATEGORIES.filter(
    (c) => !correctCategories.includes(c),
  );

  const photos: Array<{
    id: string;
    url: string;
    index: number;
    category: string;
  }> = [];

  // 정답 위치 결정 (0~8 중 3개)
  const allPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const shuffledPos = allPositions.sort(() => Math.random() - 0.5);
  const answerPositions = shuffledPos.slice(0, 3).sort((a, b) => a - b);

  // 저장할 정답 인덱스 (mock 검증용)
  (window as any).__captcha_answer_indices = answerPositions;

  let correctIdx = 0;
  let wrongIdx = 0;

  for (let i = 0; i < 9; i++) {
    if (answerPositions.includes(i)) {
      const cat = correctCategories[correctIdx];
      photos.push({
        id: `photo-${cat}-${i}`,
        url: `https://placehold.co/120x120/4CAF50/fff?text=${ANIMAL_LABELS[cat]}`,
        index: i,
        category: cat,
      });
      correctIdx++;
    } else {
      // 오답: CLIP 코사인 유사도 0.2~0.6 사이의 다른 카테고리
      const cat = otherCategories[wrongIdx % otherCategories.length];
      photos.push({
        id: `photo-${cat}-${i}`,
        url: `https://placehold.co/120x120/9E9E9E/fff?text=${ANIMAL_LABELS[cat]}`,
        index: i,
        category: cat,
      });
      wrongIdx++;
    }
  }

  return photos;
}

// ── Mock 응답 생성 ─────────────────────────────────

function mockInitResponse(payload: BehaviorPayload): CaptchaInitResponse {
  // Mock 비간섭 검증 로직:
  // 마우스 이동 50포인트 이상 + 페이지 체류 2초 이상 → pass (70~80%)
  // 마우스 이동 10~50 or 체류 1~2초 → challenge (15~25%)
  // 나머지 → block (5~10%)
  const mouseCount = payload.mouse_moves.length;
  const stayTime = payload.page_load_to_checkbox;

  if (mouseCount >= 50 && stayTime >= 2000) {
    return {
      status: 'pass',
      token: `mock-jwt-token-${payload.session_id}-${Date.now()}`,
    };
  }
  if (mouseCount < 3 && stayTime < 500) {
    return {
      status: 'block',
      message: '비정상적인 접근이 감지되었습니다.',
    };
  }
  return {
    status: 'challenge',
    session_id: payload.session_id,
  };
}

let mockChallengeData: CaptchaChallengeResponse | null = null;

function mockChallengeResponse(sessionId: string): CaptchaChallengeResponse {
  const emojis = generateMockEmojis();
  const photos = generateMockPhotos(emojis);

  mockChallengeData = {
    session_id: sessionId,
    emojis,
    photos,
  };

  return mockChallengeData;
}

function mockVerifyResponse(
  sessionId: string,
  selectedIndices: number[],
): CaptchaVerifyResponse {
  const answer = (window as any).__captcha_answer_indices as
    | number[]
    | undefined;

  if (!answer) {
    return {
      success: false,
      remaining_attempts: 4,
      message: '세션이 만료되었습니다.',
    };
  }

  // 순서까지 일치해야 정답
  const isCorrect =
    selectedIndices.length === answer.length &&
    selectedIndices.every((val, idx) => val === answer[idx]);

  if (isCorrect) {
    return {
      success: true,
      token: `mock-jwt-token-${sessionId}-${Date.now()}`,
    };
  }

  return {
    success: false,
    remaining_attempts: 4, // mock: 항상 4회 남음
    message: '정답이 아닙니다. 다시 시도해주세요.',
  };
}

// ── API 함수 ───────────────────────────────────────

/** POST /api/captcha/init — 행동 데이터 전송 + 비간섭 검증 */
export async function captchaInit(
  payload: BehaviorPayload,
): Promise<CaptchaInitResponse> {
  if (USE_MOCK) {
    await delay(800); // 네트워크 딜레이 시뮬레이션
    return mockInitResponse(payload);
  }

  const res = await fetch(`${API_BASE}/api/captcha/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`captcha/init failed: ${res.status}`);
  return res.json();
}

/** GET /api/captcha/challenge — 이미지 캡챠 세트 출제 */
export async function captchaChallenge(
  sessionId: string,
): Promise<CaptchaChallengeResponse> {
  if (USE_MOCK) {
    await delay(500);
    return mockChallengeResponse(sessionId);
  }

  const res = await fetch(
    `${API_BASE}/api/captcha/challenge?session_id=${sessionId}`,
  );
  if (!res.ok) throw new Error(`captcha/challenge failed: ${res.status}`);
  return res.json();
}

/** POST /api/captcha/verify — 정답 검증 + JWT 발급 */
export async function captchaVerify(
  sessionId: string,
  selectedIndices: number[],
): Promise<CaptchaVerifyResponse> {
  if (USE_MOCK) {
    await delay(600);
    return mockVerifyResponse(sessionId, selectedIndices);
  }

  const res = await fetch(`${API_BASE}/api/captcha/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      selected_indices: selectedIndices,
    }),
  });
  if (!res.ok) throw new Error(`captcha/verify failed: ${res.status}`);
  return res.json();
}

// ── 유틸 ───────────────────────────────────────────
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { ANIMAL_LABELS };
