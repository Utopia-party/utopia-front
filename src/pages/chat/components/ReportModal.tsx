import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ProfileDrawerUser } from '../../../types/chat';
import { createReport, type ReportCategory } from '../../../apis/report';

interface FilePreview {
  id: string;
  file: File;
  url: string | null;
  isImage: boolean;
}

interface ApiErrorShape {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
  };
}

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

const createFileId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}-${uuidv4()}`;

const isApiErrorShape = (error: unknown): error is ApiErrorShape =>
  typeof error === 'object' && error !== null && 'response' in error;

export default function ReportModal({
  targetUser,
  onClose,
  onSuccess,
}: {
  targetUser: ProfileDrawerUser | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<ReportCategory>('PROFANITY');
  const [description, setDescription] = useState('');
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const filePreviewsRef = useRef<FilePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    filePreviewsRef.current = filePreviews;
  }, [filePreviews]);

  useEffect(() => {
    return () => {
      filePreviewsRef.current.forEach((preview) => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return '이미지 또는 PDF 파일만 첨부할 수 있습니다.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return '파일은 5MB 이하만 첨부할 수 있습니다.';
    }

    return null;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];

    if (selectedFiles.length === 0) return;

    const availableCount = MAX_FILE_COUNT - filePreviews.length;

    if (availableCount <= 0) {
      alert(`증빙 파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`);
      resetFileInput();
      return;
    }

    const validFiles: File[] = [];
    const errorMessages = new Set<string>();

    for (const file of selectedFiles) {
      const errorMessage = validateFile(file);

      if (errorMessage) {
        errorMessages.add(errorMessage);
        continue;
      }

      validFiles.push(file);
    }

    errorMessages.forEach((message) => alert(message));

    const limitedFiles = validFiles.slice(0, availableCount);

    if (validFiles.length > availableCount) {
      alert(`증빙 파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`);
    }

    const newPreviews: FilePreview[] = limitedFiles.map((file) => {
      const isImage = file.type.startsWith('image/');

      return {
        id: createFileId(file),
        file,
        isImage,
        url: isImage ? URL.createObjectURL(file) : null,
      };
    });

    setFilePreviews((prev) => [...prev, ...newPreviews]);
    resetFileInput();
  };

  const removeFile = (id: string) => {
    const target = filePreviews.find((preview) => preview.id === id);

    if (target?.url) {
      URL.revokeObjectURL(target.url);
    }

    setFilePreviews((prev) => prev.filter((preview) => preview.id !== id));
    resetFileInput();
  };

  const clearFiles = () => {
    filePreviews.forEach((preview) => {
      if (preview.url) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setFilePreviews([]);
    resetFileInput();
  };

  const handleClose = () => {
    clearFiles();
    onClose();
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
        files: filePreviews.map((preview) => preview.file),
      });

      alert('신고가 접수되었습니다.');

      clearFiles();
      setDescription('');
      setCategory('PROFANITY');

      onSuccess();
    } catch (err: unknown) {
      console.error(err);

      const detail =
        isApiErrorShape(err) &&
        (typeof err.response?.data?.detail === 'string' ||
          typeof err.response?.data?.message === 'string')
          ? (err.response.data.detail ?? err.response.data.message)
          : undefined;

      alert(detail ?? '신고 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!targetUser) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 bg-slate-900 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-white">사용자 신고</h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              대상: {targetUser.nickname ?? '알 수 없음'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 text-xl font-light text-slate-400 transition hover:text-white"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="space-y-2">
              <label
                htmlFor="report-category"
                className="text-sm font-bold text-slate-800"
              >
                신고 유형
              </label>

              <select
                id="report-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ReportCategory)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="PROFANITY">욕설 / 비방</option>
                <option value="SCAM">사기 / 의심 거래</option>
                <option value="SPAM">도배 / 스팸</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="report-description"
                className="text-sm font-bold text-slate-800"
              >
                상세 설명
              </label>

              <textarea
                id="report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder="신고 사유를 자세히 적어주세요."
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <label className="text-sm font-bold text-slate-800">
                    증빙 파일 첨부
                  </label>
                  <p className="mt-1 break-keep text-xs text-slate-400">
                    이미지 또는 PDF, 최대 {MAX_FILE_COUNT}개, 파일당 5MB 이하
                  </p>
                </div>

                {filePreviews.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="self-start text-xs font-semibold text-slate-500 transition hover:text-red-600 sm:self-auto"
                  >
                    전체 삭제
                  </button>
                )}
              </div>

              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-primary hover:bg-primary/5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm transition group-hover:scale-105">
                  +
                </span>
                <span className="mt-3 text-sm font-semibold text-slate-700">
                  파일 선택
                </span>
                <span className="mt-1 break-keep text-xs text-slate-400">
                  캡처 이미지, 대화 내역 PDF 등을 첨부할 수 있습니다.
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {filePreviews.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filePreviews.map((preview) => (
                    <div
                      key={preview.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex h-36 items-center justify-center bg-slate-50 sm:h-32">
                        {preview.isImage && preview.url ? (
                          <img
                            src={preview.url}
                            alt={preview.file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center px-3 text-center">
                            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                              PDF
                            </div>
                            <p className="mt-2 line-clamp-2 break-all text-xs font-medium text-slate-600">
                              {preview.file.name}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(preview.id)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white opacity-100 transition hover:bg-red-600 md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`${preview.file.name} 삭제`}
                      >
                        ×
                      </button>

                      <div className="space-y-1 px-3 py-2">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {preview.file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatFileSize(preview.file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-100 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '접수 중...' : '신고 접수'}
          </button>
        </div>
      </div>
    </div>
  );
}
