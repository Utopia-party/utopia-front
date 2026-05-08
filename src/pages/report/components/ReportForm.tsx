import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createReport, type ReportCategory } from '../../../apis/report';
import { useAuthStore } from '../../../stores/authStore';

interface ReportFormProps {
  onCreated?: () => void | Promise<void>;
}

interface ReportFormData {
  targetIdentifier: string;
  category: ReportCategory;
  description: string;
  files: File[];
}

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
    };
  };
}

const REPORT_CATEGORIES: { label: string; value: ReportCategory }[] = [
  { label: '욕설/비방', value: 'PROFANITY' },
  { label: '사기/불이행', value: 'SCAM' },
  { label: '스팸/도배', value: 'SPAM' },
  { label: '노쇼', value: 'NO_SHOW' },
];

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

export default function ReportForm({ onCreated }: ReportFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<ReportFormData>({
    targetIdentifier: '',
    category: 'PROFANITY',
    description: '',
    files: [],
  });

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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const syncFiles = (nextPreviews: FilePreview[]) => {
    setFilePreviews(nextPreviews);
    setFormData((prev) => ({
      ...prev,
      files: nextPreviews.map((preview) => preview.file),
    }));
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

    syncFiles([...filePreviews, ...newPreviews]);
    resetFileInput();
  };

  const removeFile = (id: string) => {
    const target = filePreviews.find((preview) => preview.id === id);

    if (target?.url) {
      URL.revokeObjectURL(target.url);
    }

    const nextPreviews = filePreviews.filter((preview) => preview.id !== id);
    syncFiles(nextPreviews);
    resetFileInput();
  };

  const clearFiles = () => {
    filePreviews.forEach((preview) => {
      if (preview.url) {
        URL.revokeObjectURL(preview.url);
      }
    });

    syncFiles([]);
    resetFileInput();
  };

  const resetForm = () => {
    clearFiles();

    setFormData({
      targetIdentifier: '',
      category: 'PROFANITY',
      description: '',
      files: [],
    });
  };

  const normalizedInput = useMemo(
    () => formData.targetIdentifier.trim().toLowerCase(),
    [formData.targetIdentifier],
  );

  const isSelfReport = useMemo(() => {
    if (!currentUser || !normalizedInput) return false;

    const myEmail = currentUser.email?.trim().toLowerCase();
    const myNickname = currentUser.nickname?.trim().toLowerCase();

    return normalizedInput === myEmail || normalizedInput === myNickname;
  }, [currentUser, normalizedInput]);

  const isSubmitDisabled =
    isSubmitting ||
    isSelfReport ||
    !formData.targetIdentifier.trim() ||
    !formData.description.trim();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSelfReport) {
      alert('본인 계정은 신고할 수 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      await createReport({
        targetIdentifier: formData.targetIdentifier.trim(),
        category: formData.category,
        description: formData.description.trim(),
        files: formData.files,
      });

      alert('신고가 제출되었습니다.');

      resetForm();
      await onCreated?.();
    } catch (error: unknown) {
      console.error(error);

      const message =
        isApiErrorShape(error) &&
        typeof error.response?.data?.detail === 'string'
          ? error.response.data.detail
          : '신고 제출에 실패했습니다.';

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-blue-600">New Report</p>
        <h2 className="text-xl font-bold text-gray-900">신고 등록</h2>
        <p className="mt-1 text-sm text-gray-500">
          신고할 사용자의 닉네임 또는 이메일과 증빙 자료를 함께 제출해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="targetIdentifier"
            className="block text-sm font-semibold text-gray-800"
          >
            닉네임 또는 이메일
          </label>
          <input
            id="targetIdentifier"
            type="text"
            name="targetIdentifier"
            placeholder="신고할 사용자의 닉네임 또는 이메일"
            value={formData.targetIdentifier}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          {isSelfReport && (
            <p className="text-sm font-medium text-red-600">
              본인 계정은 신고할 수 없습니다.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="category"
            className="block text-sm font-semibold text-gray-800"
          >
            신고 사유
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            {REPORT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-gray-800"
          >
            상세 내용
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="언제, 어떤 상황에서 문제가 발생했는지 구체적으로 작성해주세요."
            value={formData.description}
            onChange={handleChange}
            required
            className="h-36 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                증빙 첨부
              </label>
              <p className="mt-1 text-xs text-gray-400">
                이미지 또는 PDF, 최대 {MAX_FILE_COUNT}개, 파일당 5MB 이하
              </p>
            </div>

            {filePreviews.length > 0 && (
              <button
                type="button"
                onClick={clearFiles}
                className="text-xs font-semibold text-gray-500 transition hover:text-red-600"
              >
                전체 삭제
              </button>
            )}
          </div>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm transition group-hover:scale-105">
              +
            </span>
            <span className="mt-3 text-sm font-semibold text-gray-700">
              파일 선택
            </span>
            <span className="mt-1 text-xs text-gray-400">
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
            <div className="grid grid-cols-2 gap-3">
              {filePreviews.map((preview) => (
                <div
                  key={preview.id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex h-32 items-center justify-center bg-gray-50">
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
                        <p className="mt-2 line-clamp-2 text-xs font-medium text-gray-600">
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
                    <p className="truncate text-xs font-semibold text-gray-800">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(preview.file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '제출 중...' : '신고 제출'}
        </button>
      </form>
    </section>
  );
}
