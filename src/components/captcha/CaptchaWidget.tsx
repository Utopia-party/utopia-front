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
import { useCallback, useEffect, useState } from 'react';
import type {
  CaptchaWidgetProps,
  CaptchaPhase,
  CaptchaChallengeResponse,
  CaptchaStatusResponse,
} from './types';
import { useBehaviorCollector } from './useBehaviorCollector';
import {
  captchaInit,
  captchaChallenge,
  captchaStatus,
  captchaVerify,
} from './captchaApi';
import CaptchaCheckbox from './CaptchaCheckbox';
import CaptchaGrid from './CaptchaGrid';
import CaptchaStatusCard from './CaptchaStatusCard';

export default function CaptchaWidget({
  onSuccess,
  onError,
  triggerType = 'new_ip_login',
}: CaptchaWidgetProps) {
  const [phase, setPhase] = useState<CaptchaPhase>('idle');
  const [challenge, setChallenge] = useState<CaptchaChallengeResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string>();
  const [remainingAttempts, setRemainingAttempts] = useState<number>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [securityStatus, setSecurityStatus] = useState<
    CaptchaStatusResponse | undefined
  >();

  // 1. 마운트 시 행동 수집 시작
  const { collectPayload } = useBehaviorCollector();

  // ── 이번 수정: 서버 상태를 UI와 즉시 맞추는 구간 ───────
  // ── 보안 상태 동기화 ───────────────────────────
  // WAIT / LOCKED / BANNED 상태는 서버가 Redis에 저장한 값을 그대로 신뢰합니다.
  // 사용자가 새로고침해도 같은 IP라면 동일한 보안 상태를 다시 받게 됩니다.
  const syncSecurityStatus = useCallback(async () => {
    const nextStatus = await captchaStatus();

    if (nextStatus.status === 'NORMAL') {
      setSecurityStatus(undefined);
      return nextStatus;
    }

    // WAIT / LOCKED / BANNED 상태에서는 이전 성공 토큰을 무효화합니다.
    onError?.(nextStatus.message);
    setSecurityStatus(nextStatus);
    return nextStatus;
  }, [onError]);

  // ── 이번 수정: 모달 종료/새로고침 후 challenge 복구 ────
  // ── 진행 중 challenge 복구 ─────────────────────
  // 사용자가 모달을 닫거나 새로고침했더라도 서버에 active_session_id가 남아 있으면
  // 같은 문제를 다시 불러와서 이어서 풀게 만듭니다.
  const restoreChallenge = useCallback(
    async (sessionId: string) => {
      setPhase('verifying');
      setChallenge(null);
      setCurrentSessionId(sessionId);
      setErrorMessage(undefined);
      setRemainingAttempts(undefined);
      setSecurityStatus(undefined);
      onError?.('캡챠를 다시 진행해주세요.');

      try {
        const challengeData = await captchaChallenge(sessionId);
        setChallenge(challengeData);
        setPhase('challenge');
      } catch (_error) {
        setCurrentSessionId(undefined);
        setPhase('failed');
        setErrorMessage('진행 중인 캡챠를 복구하는 중 오류가 발생했습니다.');
      }
    },
    [onError],
  );

  useEffect(() => {
    const initializeWidget = async () => {
      const nextStatus = await syncSecurityStatus();

      if (nextStatus.status === 'NORMAL' && nextStatus.active_session_id) {
        await restoreChallenge(nextStatus.active_session_id);
      }
    };

    void initializeWidget();
  }, [restoreChallenge, syncSecurityStatus]);

  useEffect(() => {
    if (
      !securityStatus ||
      securityStatus.status === 'BANNED' ||
      !securityStatus.retry_after_seconds ||
      securityStatus.retry_after_seconds <= 0
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecurityStatus((current) => {
        if (
          !current ||
          !current.retry_after_seconds ||
          current.retry_after_seconds <= 0
        ) {
          return current;
        }

        return {
          ...current,
          retry_after_seconds: current.retry_after_seconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [securityStatus]);

  // ── 이번 수정: 체크박스 클릭과 재시도 버튼을 한 흐름으로 통합 ──
  // ── 캡챠 시도 시작 ─────────────────────────────
  // 체크박스 클릭과 잠금 해제 후 재시도는 모두 여기로 모읍니다.
  // 백엔드가 active_session_id를 기억하고 있으면 새 판정 대신 기존 challenge로 돌려보냅니다.
  const startCaptchaAttempt = useCallback(
    async (ignoreSecurityState = false) => {
      if (
        !ignoreSecurityState &&
        securityStatus &&
        securityStatus.status !== 'NORMAL'
      ) {
        return;
      }

      setPhase('verifying');
      setChallenge(null);
      setCurrentSessionId(undefined);
      setErrorMessage(undefined);
      setRemainingAttempts(undefined);

      try {
        const payload = collectPayload();
        const result = await captchaInit(payload, triggerType);

        switch (result.status) {
          case 'pass':
            // 비간섭 검증 통과 (70~80%)
            setSecurityStatus(undefined);
            setPhase('passed');
            setTimeout(() => {
              setPhase('success');
              if (result.token) onSuccess(result.token);
            }, 500);
            break;

          case 'challenge':
            // 이미지 캡챠 출제 (잠금 해제 직후에는 이 경로를 강제로 타도록 백엔드에서 보정합니다.)
            await restoreChallenge(result.session_id!);
            break;

          case 'block':
            // 즉시 차단 (5~10%)
            setChallenge(null);
            setCurrentSessionId(undefined);
            setRemainingAttempts(undefined);
            setPhase('blocked');
            try {
              const nextStatus = await syncSecurityStatus();
              if (nextStatus.status !== 'NORMAL') {
                onError?.(nextStatus.message);
                return;
              }
            } catch (_error) {
              // status API가 실패하면 기존 blocked 카드라도 보여주도록 유지합니다.
            }

            setErrorMessage(result.message ?? '차단되었습니다.');
            onError?.(result.message ?? '차단되었습니다.');
            break;
        }
      } catch (err) {
        setPhase('failed');
        setErrorMessage('검증 중 오류가 발생했습니다.');
        onError?.('검증 오류');
      }
    },
    [
      collectPayload,
      onSuccess,
      onError,
      securityStatus,
      syncSecurityStatus,
      triggerType,
    ],
  );

  const handleCheckboxClick = useCallback(async () => {
    await startCaptchaAttempt();
  }, [startCaptchaAttempt]);

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
          setSecurityStatus(undefined);
          setPhase('success');
          if (result.token) onSuccess(result.token);
        } else {
          setRemainingAttempts(result.remaining_attempts);

          if (result.remaining_attempts === 0) {
            // 5회 실패 → 차단
            setChallenge(null);
            setCurrentSessionId(undefined);
            setPhase('blocked');

            try {
              const nextStatus = await syncSecurityStatus();
              if (nextStatus.status !== 'NORMAL') {
                onError?.(nextStatus.message);
                return;
              }
            } catch (_error) {
              // status 확인이 실패하면 blocked 상태는 유지합니다.
            }

            setErrorMessage(result.message ?? '시도 횟수를 초과했습니다.');
            onError?.(result.message ?? '시도 횟수를 초과했습니다.');
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
    [currentSessionId, onSuccess, onError, syncSecurityStatus],
  );

  // ── 이번 수정: 잠금 해제 후 즉시 다시 캡챠로 진입 ─────
  const handleRetryCheck = useCallback(async () => {
    try {
      const nextStatus = await syncSecurityStatus();

      if (nextStatus.status === 'NORMAL') {
        setChallenge(null);
        setCurrentSessionId(undefined);
        setErrorMessage(undefined);
        setRemainingAttempts(undefined);
        setPhase('idle');
        if (nextStatus.active_session_id) {
          await restoreChallenge(nextStatus.active_session_id);
          return;
        }

        await startCaptchaAttempt(true);
      }
    } catch (_error) {
      setErrorMessage('보안 상태를 다시 확인하는 중 오류가 발생했습니다.');
    }
  }, [restoreChallenge, startCaptchaAttempt, syncSecurityStatus]);

  // ── 이번 수정: UI를 닫아도 서버 세션은 유지 ───────────
  // 그리드 닫기 (체크박스로 돌아감)
  const handleGridCancel = useCallback(() => {
    // 사용자가 UI만 닫은 경우에는 서버 쪽 active_session_id를 일부러 지우지 않습니다.
    // 다시 열면 같은 challenge를 이어서 풀게 만드는 것이 목적입니다.
    setChallenge(null);
    setCurrentSessionId(undefined);
    setRemainingAttempts(undefined);
    setPhase('idle');
    setErrorMessage(undefined);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {securityStatus && securityStatus.status !== 'NORMAL' ? (
        <CaptchaStatusCard
          status={securityStatus.status}
          message={securityStatus.message}
          retryAfterSeconds={securityStatus.retry_after_seconds}
          onRetryCheck={handleRetryCheck}
        />
      ) : (
        /* 체크박스는 일반 상태일 때만 표시 */
        <CaptchaCheckbox phase={phase} onClick={handleCheckboxClick} />
      )}

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

      {phase === 'blocked' &&
        (!securityStatus || securityStatus.status === 'NORMAL') &&
        errorMessage && (
          <p className="max-w-[360px] text-center text-xs leading-5 text-red-500">
            {errorMessage}
          </p>
        )}
    </div>
  );
}
