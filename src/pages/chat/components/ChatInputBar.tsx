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
  return (
    <>
      <div className="mx-5 mb-3 flex gap-2">
        <input
          className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary bg-background"
          placeholder="메시지 입력"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              onSend();
            }
          }}
        />
        <button
          onClick={onSend}
          disabled={!connected || !input.trim()}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold disabled:opacity-40"
        >
          전송
        </button>
      </div>

      <div className="mx-5 mb-4">
        <button
          onClick={() => !alreadyPaid && onPaymentClick()}
          disabled={alreadyPaid}
          className={`w-full py-3 border-2 rounded-2xl text-sm font-bold transition ${
            alreadyPaid
              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'border-primary text-primary hover:bg-primary/5'
          }`}
        >
          {alreadyPaid ? '이번 달 결제 완료 ✓' : '정산요청'}
        </button>
      </div>
    </>
  );
}
