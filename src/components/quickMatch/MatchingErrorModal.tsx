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
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-3xl ring-1 ring-rose-100">
            😥
          </div>

          <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
            {content.title}
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {content.message}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            {content.subMessage}
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {content.secondaryButtonText}
          </button>

          {shouldShowRetryButton ? (
            <button
              onClick={onRetry}
              className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              {content.primaryButtonText}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
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
