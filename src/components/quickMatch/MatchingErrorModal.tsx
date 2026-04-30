type MatchingErrorModalProps = {
  open: boolean;
  message?: string;
  errorCode?: string;
  onClose: () => void;
  onRetry?: () => void;
};

type ErrorModalContent = {
  title: string;
  message: string;
  subMessage: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  showRetry: boolean;
};

function getErrorModalContent(
  errorCode?: string,
  fallbackMessage = '조건에 맞는 파티를 찾지 못했어요.',
): ErrorModalContent {
  switch (errorCode) {
    case 'ALREADY_IN_ACTIVE_PARTY':
      return {
        title: '이미 이용 중인 서비스예요',
        message: '해당 서비스에 이미 참여 중인 파티가 있습니다.',
        subMessage: '기존 파티를 확인하거나, 다른 서비스를 선택해주세요.',
        secondaryButtonText: '둘러보기',
        primaryButtonText: '확인',
        showRetry: false,
      };

    case 'ALREADY_REQUESTED':
      return {
        title: '이미 빠른매칭이 진행 중이에요',
        message: '현재 해당 서비스에 대한 빠른매칭 요청이 진행 중입니다.',
        subMessage:
          '잠시 후 결과를 확인하거나, 기존 요청이 끝난 뒤 다시 시도해주세요.',
        secondaryButtonText: '둘러보기',
        primaryButtonText: '확인',
        showRetry: false,
      };

    case 'USER_BANNED':
    case 'USER_INACTIVE':
      return {
        title: '빠른매칭을 이용할 수 없어요',
        message: fallbackMessage,
        subMessage: '계정 상태를 확인한 뒤 다시 시도해주세요.',
        secondaryButtonText: '둘러보기',
        primaryButtonText: '확인',
        showRetry: false,
      };

    case 'NO_RECRUITING_PARTY':
    case 'NO_CANDIDATE':
    default:
      return {
        title: '아직 딱 맞는 파티를 찾지 못했어요',
        message: fallbackMessage,
        subMessage: '조건을 조금 바꾸거나, 잠시 후 다시 시도해보세요.',
        secondaryButtonText: '둘러보기',
        primaryButtonText: '다시 시도',
        showRetry: true,
      };
  }
}

export default function MatchingErrorModal({
  open,
  message = '조건에 맞는 파티를 찾지 못했어요.',
  errorCode,
  onClose,
  onRetry,
}: MatchingErrorModalProps) {
  if (!open) return null;

  const content = getErrorModalContent(errorCode, message);
  const shouldShowRetryButton = content.showRetry && Boolean(onRetry);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        // 모바일 최적화: 여백(p)과 모서리 둥글기를 반응형으로 조정
        className="w-full max-w-md rounded-2xl sm:rounded-[28px] bg-white p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* 아이콘 크기 유동적 조절 */}
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-rose-50 text-2xl sm:text-3xl ring-1 ring-rose-100">
            😥
          </div>

          <h3 className="mt-3 sm:mt-4 break-keep text-lg sm:text-xl font-extrabold text-slate-900">
            {content.title}
          </h3>

          <p className="mt-2 sm:mt-3 break-keep text-xs sm:text-sm leading-relaxed sm:leading-6 text-slate-500">
            {content.message}
          </p>

          <p className="mt-1.5 sm:mt-2 break-keep text-[11px] sm:text-xs leading-relaxed sm:leading-5 text-slate-400">
            {content.subMessage}
          </p>
        </div>

        {/* 버튼 영역 터치감 개선 및 비율 조정 */}
        <div className="mt-5 sm:mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl sm:rounded-2xl border border-slate-200 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            {content.secondaryButtonText}
          </button>

          {shouldShowRetryButton ? (
            <button
              onClick={onRetry}
              className="flex-1 rounded-xl sm:rounded-2xl bg-slate-900 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
            >
              {content.primaryButtonText}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 rounded-xl sm:rounded-2xl bg-slate-900 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
            >
              {content.primaryButtonText === '다시 시도'
                ? '확인'
                : content.primaryButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
