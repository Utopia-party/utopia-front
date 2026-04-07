/**
 * Captcha API 서비스
 * 실제 백엔드 1차 캡챠 엔드포인트와 통신합니다.
 */
import { api } from '../../libs/api';
import type { BehaviorPayload } from './useBehaviorCollector';
import type {
  CaptchaChallengeResponse,
  CaptchaInitResponse,
  CaptchaStatusResponse,
  CaptchaVerifyResponse,
} from './types';

// 상원: 이 상수는 서버가 내려준 동물 category 코드를 화면용 한글 이름으로 바꿀 때 사용합니다.
export const ANIMAL_LABELS: Record<string, string> = {
  // 상원: cat 코드는 화면에서 고양이로 보여줍니다.
  cat: '고양이',
  // 상원: dog 코드는 화면에서 강아지로 보여줍니다.
  dog: '강아지',
  // 상원: bear 코드는 화면에서 곰으로 보여줍니다.
  bear: '곰',
  // 상원: fox 코드는 화면에서 여우로 보여줍니다.
  fox: '여우',
  // 상원: penguin 코드는 화면에서 펭귄으로 보여줍니다.
  penguin: '펭귄',
};

// 상원: FR-110~117 흐름에서 체크박스 클릭 시 수집한 행동 데이터를 1차 캡챠 판정 API로 보냅니다.
export async function captchaInit(
  payload: BehaviorPayload & {
    trigger_type: 'register' | 'new_ip_login' | 'login_fail';
  },
): Promise<CaptchaInitResponse> {
  // 상원: /api/captcha/init 으로 행동 데이터와 trigger_type을 POST 합니다.
  const { data } = await api.post<CaptchaInitResponse>(
    '/api/captcha/init',
    payload,
  );
  // 상원: 서버가 판정한 pass, challenge, block 결과를 그대로 돌려줍니다.
  return data;
}

// 상원: 1차 판정 결과가 challenge일 때 현재 세션의 3x3 이미지 문제를 불러옵니다.
export async function captchaChallenge(
  sessionId: string,
): Promise<CaptchaChallengeResponse> {
  // 상원: 현재 세션 id를 query parameter로 보내 challenge 이미지 세트를 요청합니다.
  const { data } = await api.get<CaptchaChallengeResponse>(
    '/api/captcha/challenge',
    {
      params: { session_id: sessionId },
    },
  );
  // 상원: 이모지 3개와 사진 9개가 담긴 challenge 응답을 돌려줍니다.
  return data;
}

// 상원: 사용자가 고른 3칸의 순서를 서버에 보내 정답 여부와 통과 토큰을 검증합니다.
export async function captchaVerify(
  sessionId: string,
  selectedIndices: number[],
): Promise<CaptchaVerifyResponse> {
  // 상원: 사용자가 누른 칸 번호 3개를 세션 id와 함께 검증 API로 보냅니다.
  const { data } = await api.post<CaptchaVerifyResponse>(
    '/api/captcha/verify',
    {
      session_id: sessionId,
      selected_indices: selectedIndices,
    },
  );
  // 상원: success 여부, 남은 시도 횟수, 토큰을 포함한 검증 결과를 돌려줍니다.
  return data;
}

// 상원: WAIT, LOCKED, BANNED 상태와 진행 중 challenge 세션이 남아 있는지 확인합니다.
export async function captchaStatus(): Promise<CaptchaStatusResponse> {
  // 상원: 재시도 대기, 잠금, 차단, 진행 중 세션 복구 여부를 status API로 확인합니다.
  const { data } = await api.get<CaptchaStatusResponse>('/api/captcha/status');
  // 상원: 위젯이 phase를 정할 수 있도록 상태 응답을 그대로 반환합니다.
  return data;
}
