/**
 * CaptchaWidget — 메인 오케스트레이터 컴포넌트
 * 체크박스는 기존 위치에 유지하고, challenge는 모달형으로 표시합니다.
 */
import { useCallback, useEffect, useState } from 'react';
import type {
  CaptchaChallengeResponse,
  CaptchaPhase,
  CaptchaStatusResponse,
  CaptchaWidgetProps,
} from './types';
import { useBehaviorCollector } from './useBehaviorCollector';
import {
  captchaChallenge,
  captchaInit,
  captchaStatus,
  captchaVerify,
} from './captchaApi';
import CaptchaCheckbox from './CaptchaCheckbox';
import CaptchaGrid from './CaptchaGrid';
import CaptchaStatusCard from './CaptchaStatusCard';

function mapStatusToPhase(
  status: Extract<
    CaptchaStatusResponse['status'],
    'WAIT' | 'LOCKED' | 'BANNED'
  >,
): Extract<CaptchaPhase, 'wait' | 'locked' | 'banned'> {
  if (status === 'WAIT') return 'wait';
  if (status === 'LOCKED') return 'locked';
  return 'banned';
}

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
  const [securityStatus, setSecurityStatus] =
    useState<CaptchaStatusResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const { collectPayload } = useBehaviorCollector();

  // 상원: challenge 화면이 끝날 때마다 이전 문제와 에러 상태를 함께 정리합니다.
  const resetChallengeView = useCallback(() => {
    setChallenge(null);
    setErrorMessage(undefined);
    setRemainingAttempts(undefined);
  }, []);

  // 상원: 서버가 기억 중인 active_session_id가 있으면 같은 문제로 복구합니다.
  const restoreChallenge = useCallback(async (sessionId: string) => {
    const challengeData = await captchaChallenge(sessionId);
    setCurrentSessionId(sessionId);
    setChallenge(challengeData);
    setErrorMessage(undefined);
    setRemainingAttempts(undefined);
    setPhase('challenge');
  }, []);

  const applySecurityStatus = useCallback(
    (nextStatus: CaptchaStatusResponse) => {
      setSecurityStatus(nextStatus);

      if (nextStatus.status === 'NORMAL') {
        if (!nextStatus.active_session_id) {
          setPhase((prev) =>
            prev === 'wait' || prev === 'locked' || prev === 'banned'
              ? 'idle'
              : prev,
          );
        }
        return nextStatus;
      }

      resetChallengeView();
      setPhase(mapStatusToPhase(nextStatus.status));
      onError?.(nextStatus.message);
      return nextStatus;
    },
    [onError, resetChallengeView],
  );

  const syncStatus = useCallback(async () => {
    const nextStatus = await captchaStatus();

    if (nextStatus.status !== 'NORMAL') {
      return applySecurityStatus(nextStatus);
    }

    setSecurityStatus(nextStatus);

    if (nextStatus.active_session_id) {
      await restoreChallenge(nextStatus.active_session_id);
    } else {
      setPhase((prev) =>
        prev === 'wait' || prev === 'locked' || prev === 'banned'
          ? 'idle'
          : prev,
      );
    }

    return nextStatus;
  }, [applySecurityStatus, restoreChallenge]);

  // 상원: 페이지 진입 직후 대기/잠금 상태나 남아 있는 challenge 세션을 먼저 동기화합니다.
  useEffect(() => {
    void syncStatus();
  }, [syncStatus]);

  // 상원: 체크박스 클릭 시 행동 데이터를 보내고 pass, challenge, block 세 갈래로 분기합니다.
  const startCaptchaFlow = useCallback(async () => {
    setIsRetrying(true);
    setErrorMessage(undefined);

    try {
      const nextStatus = await syncStatus();

      if (nextStatus.status !== 'NORMAL') {
        return;
      }

      if (nextStatus.active_session_id) {
        return;
      }

      setPhase('verifying');

      const payload = collectPayload();
      const result = await captchaInit({
        ...payload,
        trigger_type: triggerType,
      });

      switch (result.status) {
        case 'pass':
          setSecurityStatus(null);
          setPhase('passed');
          window.setTimeout(() => {
            setPhase('success');
            if (result.token) {
              onSuccess(result.token);
            }
          }, 500);
          break;

        case 'challenge':
          if (!result.session_id) {
            throw new Error('challenge session_id missing');
          }

          await restoreChallenge(result.session_id);
          break;

        case 'block': {
          const refreshedStatus = await syncStatus();

          if (refreshedStatus.status === 'NORMAL') {
            setSecurityStatus({
              status: 'WAIT',
              message:
                result.message ??
                '보안 정책에 따라 이용이 일시 제한되었습니다.',
              retry_after_seconds: 0,
              active_session_id: null,
            });
            setPhase('wait');
            onError?.(result.message ?? '일시 제한');
          }
          break;
        }
      }
    } catch {
      setPhase('failed');
      setErrorMessage('검증 중 오류가 발생했습니다.');
      onError?.('검증 오류');
    } finally {
      setIsRetrying(false);
    }
  }, [
    collectPayload,
    onError,
    onSuccess,
    restoreChallenge,
    syncStatus,
    triggerType,
  ]);

  // 상원: 사용자가 선택한 3칸을 검증하고, 실패 시에는 같은 세션의 다음 문제를 다시 받아옵니다.
  const handleGridSubmit = useCallback(
    async (selectedIndices: number[]) => {
      if (!currentSessionId) return;

      setPhase('submitting');
      setErrorMessage(undefined);

      try {
        const result = await captchaVerify(currentSessionId, selectedIndices);

        if (result.success) {
          resetChallengeView();
          setSecurityStatus(null);
          setPhase('success');

          if (result.token) {
            onSuccess(result.token);
          }
          return;
        }

        setRemainingAttempts(result.remaining_attempts ?? undefined);

        if ((result.remaining_attempts ?? 0) <= 0) {
          const nextStatus = await syncStatus();

          if (nextStatus.status === 'NORMAL') {
            setSecurityStatus({
              status: 'LOCKED',
              message:
                result.message ?? '실패 횟수 초과로 잠시 잠금 상태입니다.',
              retry_after_seconds: 0,
              active_session_id: null,
            });
            setPhase('locked');
            onError?.(result.message ?? '잠금 상태');
          }
          return;
        }

        setErrorMessage(
          result.message ?? '정답이 아닙니다. 다시 시도해주세요.',
        );

        const nextChallenge = await captchaChallenge(currentSessionId);
        setChallenge(nextChallenge);
        setPhase('challenge');
      } catch {
        setPhase('challenge');
        setErrorMessage('검증 중 오류가 발생했습니다.');
      }
    },
    [currentSessionId, onError, onSuccess, resetChallengeView, syncStatus],
  );

  const handleGridCancel = useCallback(() => {
    resetChallengeView();
    setPhase('idle');
  }, [resetChallengeView]);

  const handleGridRefresh = useCallback(async () => {
    if (!currentSessionId || isRetrying || phase === 'submitting') return;

    setIsRetrying(true);
    setErrorMessage(undefined);
    setRemainingAttempts(undefined);

    try {
      const nextChallenge = await captchaChallenge(currentSessionId);
      setChallenge(nextChallenge);
      setPhase('challenge');
    } catch {
      setErrorMessage('새 문제를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsRetrying(false);
    }
  }, [currentSessionId, isRetrying, phase]);

  // 상원: WAIT, LOCKED, BANNED 상태 카드가 필요한 경우에만 화면에 노출할 값을 정리합니다.
  let visibleStatus:
    | (CaptchaStatusResponse & { status: 'WAIT' | 'LOCKED' | 'BANNED' })
    | null = null;

  if (
    securityStatus?.status === 'WAIT' ||
    securityStatus?.status === 'LOCKED' ||
    securityStatus?.status === 'BANNED'
  ) {
    visibleStatus = {
      ...securityStatus,
      status: securityStatus.status,
    };
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <CaptchaCheckbox phase={phase} onClick={startCaptchaFlow} />

      {visibleStatus && (
        <CaptchaStatusCard
          key={`${visibleStatus.status}:${visibleStatus.retry_after_seconds ?? 0}`}
          status={visibleStatus.status}
          message={visibleStatus.message}
          retryAfterSeconds={visibleStatus.retry_after_seconds}
          onRetry={startCaptchaFlow}
          isRetrying={isRetrying}
        />
      )}

      {(phase === 'challenge' || phase === 'submitting') && challenge && (
        <CaptchaGrid
          challenge={challenge}
          onSubmit={handleGridSubmit}
          onCancel={handleGridCancel}
          onRefresh={handleGridRefresh}
          isSubmitting={phase === 'submitting'}
          errorMessage={errorMessage}
          remainingAttempts={remainingAttempts}
        />
      )}
    </div>
  );
}
