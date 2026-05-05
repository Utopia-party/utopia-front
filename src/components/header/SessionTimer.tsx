import { formatSessionTime } from './headerUtils';

interface SessionTimerProps {
  sessionTimeLeft: number;
  onExtend: () => void;
}

export function SessionTimer({ sessionTimeLeft, onExtend }: SessionTimerProps) {
  return (
    <div className="mr-2 flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm transition-colors">
      <span className={`font-mono font-medium ${sessionTimeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
        {formatSessionTime(sessionTimeLeft)}
      </span>
      <div className="h-3 w-px bg-blue-200" />
      <button
        type="button"
        onClick={onExtend}
        className="text-xs font-bold text-blue-700 hover:underline"
      >
        연장
      </button>
    </div>
  );
}
