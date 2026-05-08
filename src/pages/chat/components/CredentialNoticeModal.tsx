import { useState } from 'react';
import { api } from '../../../apis/api';

interface CredentialNoticeModalProps {
  partyId: string;
  existingContent?: string | null;
  onClose: () => void;
  onSaved: (content: string) => void;
}

export function CredentialNoticeModal({
  partyId,
  existingContent,
  onClose,
  onSaved,
}: CredentialNoticeModalProps) {
  const [content, setContent] = useState(existingContent ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      if (existingContent != null) {
        await api.put(`/api/settlement/parties/${partyId}/notice`, { content });
      } else {
        await api.post(`/api/settlement/parties/${partyId}/notice`, { content });
      }
      onSaved(content);
      onClose();
    } catch {
      alert('공지 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('공지를 삭제하시겠습니까?')) return;
    setIsLoading(true);
    try {
      await api.delete(`/api/settlement/parties/${partyId}/notice`);
      onSaved('');
      onClose();
    } catch {
      alert('공지 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-slate-900 px-5 py-4">
          <div>
            <h2 className="text-sm font-extrabold text-white">채팅방 공지 등록</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              아이디/비밀번호를 입력하면 채팅방 상단에 고정됩니다
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl font-light text-slate-400 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-700">정산 승인이 완료되었습니다</p>
            <p className="mt-0.5 text-xs text-amber-600">
              공유할 아이디와 비밀번호를 입력해주세요. 모든 파티원에게 공개됩니다.
            </p>
          </div>

          <textarea
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={5}
            placeholder={`예시:\nID: partyup1234\nPW: password!@#`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex gap-2">
            {existingContent != null && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !content.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                '공지 등록'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
