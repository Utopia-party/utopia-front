import { useState } from 'react';
import type { PartyNotice } from '../../../types/chat';

interface NoticeBarProps {
  notice: PartyNotice;
  isLeader: boolean;
  onEdit: () => void;
}

export function NoticeBar({ notice, isLeader, onEdit }: NoticeBarProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = notice.content.split('\n');
  const isMultiLine = lines.length > 1;
  const previewText = lines[0];

  return (
    <div className="shrink-0 border-b border-amber-200 bg-amber-50">
      <div className="flex min-w-0 items-start gap-2 px-4 py-2.5">
        <span className="mt-0.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-600">
          공지
        </span>

        <div className="min-w-0 flex-1">
          {expanded ? (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
              {notice.content}
            </p>
          ) : (
            <p className="truncate text-xs text-slate-700">{previewText}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isMultiLine && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-medium text-amber-600 hover:text-amber-800"
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}
          {isLeader && (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs text-slate-400 transition-colors hover:text-slate-600"
            >
              수정
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
