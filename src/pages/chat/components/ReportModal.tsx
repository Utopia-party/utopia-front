import { useState } from 'react';
import type { ProfileDrawerUser } from '../../../types/chat';
import { createReport, type ReportCategory } from '../../../apis/report';

export default function ReportModal({
  targetUser,
  onClose,
  onSuccess,
}: {
  targetUser: ProfileDrawerUser | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [category, setCategory] = useState<ReportCategory>('PROFANITY');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFiles(selectedFiles);
  };

  const handleSubmit = async () => {
    if (!targetUser?.nickname?.trim()) {
      alert('신고 대상을 확인할 수 없습니다.');
      return;
    }

    if (!description.trim()) {
      alert('신고 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReport({
        targetIdentifier: targetUser.nickname.trim(),
        category,
        description: description.trim(),
        files,
      });

      alert('신고가 접수되었습니다.');
      onSuccess();
    } catch (err: unknown) {
      const detail =
        typeof err === 'object' && err !== null && 'response' in err
          ? (
              err as {
                response?: { data?: { detail?: string; message?: string } };
              }
            ).response?.data?.detail ||
            (
              err as {
                response?: { data?: { detail?: string; message?: string } };
              }
            ).response?.data?.message
          : undefined;

      alert(detail ?? '신고 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-80 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-slate-900 px-6 py-5">
          <div>
            <h2 className="text-base font-extrabold text-white">사용자 신고</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              대상: {targetUser?.nickname ?? '알 수 없음'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl font-light text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">
              신고 유형
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="PROFANITY">욕설 / 비방</option>
              <option value="SCAM">사기 / 의심 거래</option>
              <option value="SPAM">도배 / 스팸</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">
              상세 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="신고 사유를 자세히 적어주세요."
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">
              증빙 파일 첨부
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
            />
            {files.length > 0 && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  첨부 파일
                </p>
                <div className="flex flex-col gap-1">
                  {files.map((file, idx) => (
                    <p
                      key={`${file.name}-${idx}`}
                      className="truncate text-xs text-slate-700"
                    >
                      {file.name}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? '접수 중...' : '신고 접수'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
