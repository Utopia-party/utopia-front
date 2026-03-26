/**
 * CaptchaWidget — 메인 오케스트레이터 컴포넌트
 * CONTEXT.md Section 14:
 *   1. 마운트 시 마우스/클릭/키 입력 수집 시작
 *   2. "로봇이 아닙니다" 체크박스 렌더링
 *   3. 체크박스 클릭 → POST /api/captcha/init
 *   4. challenge 응답 → 3×3 그리드 캡챠 위젯 표시
 *   5. 정답 제출 → POST /api/captcha/verify
 *   6. 통과 → onSuccess(token) 콜백 호출
 *
 * 사용법:
 *   <CaptchaWidget onSuccess={(token) => { ... }} />
 */
import { useState, useCallback } from 'react';
import type {
  CaptchaWidgetProps,
  CaptchaPhase,
  CaptchaChallengeResponse,
} from './types';
import { useBehaviorCollector } from './useBehaviorCollector';
import { captchaInit, captchaChallenge, captchaVerify } from './captchaApi';
import CaptchaCheckbox from './CaptchaCheckbox';
import CaptchaGrid from './CaptchaGrid';

export default function CaptchaWidget({
  onSuccess,
  onError,
}: CaptchaWidgetProps) {
  const [phase, setPhase] = useState<CaptchaPhase>('idle');
  const [challenge, setChallenge] = useState<CaptchaChallengeResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string>();
  const [remainingAttempts, setRemainingAttempts] = useState<number>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();

  // 1. 마운트 시 행동 수집 시작
  const { collectPayload } = useBehaviorCollector();

  // 2+3. 체크박스 클릭 → 비간섭 검증
  const handleCheckboxClick = useCallback(async () => {
    setPhase('verifying');
    setErrorMessage(undefined);

    try {
      const payload = collectPayload();
      const result = await captchaInit(payload);

      switch (result.status) {
        case 'pass':
          // 비간섭 검증 통과 (70~80%)
          setPhase('passed');
          setTimeout(() => {
            setPhase('success');
            if (result.token) onSuccess(result.token);
          }, 500);
          break;

        case 'challenge':
          // 이미지 캡챠 출제 (15~25%)
          setCurrentSessionId(result.session_id);
          const challengeData = await captchaChallenge(result.session_id!);
          setChallenge(challengeData);
          setPhase('challenge');
          break;

        case 'block':
          // 즉시 차단 (5~10%)
          setPhase('blocked');
          onError?.(result.message ?? '차단되었습니다.');
          break;
      }
    } catch (err) {
      setPhase('failed');
      setErrorMessage('검증 중 오류가 발생했습니다.');
      onError?.('검증 오류');
    }
  }, [collectPayload, onSuccess, onError]);

  // 5. 정답 제출 → 검증
  const handleGridSubmit = useCallback(
    async (selectedIndices: number[]) => {
      if (!currentSessionId) return;

      setPhase('submitting');
      setErrorMessage(undefined);

      try {
        const result = await captchaVerify(currentSessionId, selectedIndices);

        if (result.success) {
          // 6. 통과 → onSuccess(token)
          setChallenge(null);
          setPhase('success');
          if (result.token) onSuccess(result.token);
        } else {
          setRemainingAttempts(result.remaining_attempts);

          if (result.remaining_attempts === 0) {
            // 5회 실패 → 차단
            setPhase('blocked');
            setChallenge(null);
            onError?.('시도 횟수를 초과했습니다.');
          } else {
            // 재시도 가능: 새 문제 출제
            setErrorMessage(result.message);
            const newChallenge = await captchaChallenge(currentSessionId);
            setChallenge(newChallenge);
            setPhase('challenge');
          }
        }
      } catch (err) {
        setPhase('challenge');
        setErrorMessage('검증 중 오류가 발생했습니다.');
      }
    },
    [currentSessionId, onSuccess, onError],
  );

  // 그리드 닫기 (체크박스로 돌아감)
  const handleGridCancel = useCallback(() => {
    setChallenge(null);
    setPhase('idle');
    setErrorMessage(undefined);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 체크박스는 항상 표시 */}
      <CaptchaCheckbox phase={phase} onClick={handleCheckboxClick} />

      {/* challenge일 때 그리드 표시 */}
      {(phase === 'challenge' || phase === 'submitting') && challenge && (
        <CaptchaGrid
          challenge={challenge}
          onSubmit={handleGridSubmit}
          onCancel={handleGridCancel}
          isSubmitting={phase === 'submitting'}
          errorMessage={errorMessage}
          remainingAttempts={remainingAttempts}
        />
      )}
    </div>
  );
}
