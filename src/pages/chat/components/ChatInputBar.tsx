interface ChatInputBarProps {
  input: string;
  connected: boolean;
  alreadyPaid: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onPaymentClick: () => void;
}

export function ChatInputBar({
  input,
  connected,
  alreadyPaid,
  onChange,
  onSend,
  onPaymentClick,
}: ChatInputBarProps) {
  const canSend = connected && input.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-border bg-background/95 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur sm:px-5">
      <div className="flex min-w-0 gap-2">
        <input
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary"
          placeholder={connected ? '메시지 입력' : '연결 중...'}
          value={input}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              onSend();
            }
          }}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="min-h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6"
        >
          전송
        </button>
      </div>

      <button
        type="button"
        onClick={() => !alreadyPaid && onPaymentClick()}
        disabled={alreadyPaid}
        className={`mt-2 min-h-11.5 w-full rounded-2xl border-2 text-sm font-bold transition active:scale-95 ${
          alreadyPaid
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            : 'border-primary bg-background text-primary hover:bg-primary/5'
        }`}
      >
        {alreadyPaid ? '이번 달 결제 완료 ✓' : '정산요청'}
      </button>
    </div>
  );
}
