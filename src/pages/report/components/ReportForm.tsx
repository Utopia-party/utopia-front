import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { createReport, type ReportCategory } from '../../../apis/report';
import { useAuthStore } from '../../../stores/authStore';

interface ReportFormData {
  targetIdentifier: string;
  category: ReportCategory;
  description: string;
  files: File[];
}

const REPORT_CATEGORIES: { label: string; value: ReportCategory }[] = [
  { label: '욕설/비방', value: 'PROFANITY' },
  { label: '사기/불이행', value: 'SCAM' },
  { label: '스팸/도배', value: 'SPAM' },
];

export default function ReportForm() {
  const currentUser = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState<ReportFormData>({
    targetIdentifier: '',
    category: 'PROFANITY',
    description: '',
    files: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    setFormData((prev) => ({ ...prev, files: selectedFiles }));
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

      setFormData({
        targetIdentifier: '',
        category: 'PROFANITY',
        description: '',
        files: [],
      });
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.detail ?? '신고 제출에 실패했습니다.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">신고 등록</h2>
        <p className="mt-1 text-sm text-gray-500">
          신고할 사용자의 닉네임 또는 이메일을 입력해주세요.
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
            placeholder="신고할 사용자의 닉네임 또는 이메일을 입력하세요"
            value={formData.targetIdentifier}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          {isSelfReport && (
            <p className="text-sm text-red-600">
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

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            증빙 첨부
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
            <span className="text-sm font-medium text-gray-700">
              파일을 선택해 업로드
            </span>
            <span className="mt-1 text-xs text-gray-400">
              이미지, 캡처, 대화 내역 등을 첨부할 수 있습니다.
            </span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {formData.files.length > 0 && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {formData.files.map((file) => (
                <div key={`${file.name}-${file.size}`}>{file.name}</div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isSelfReport}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '제출 중...' : '신고 제출'}
        </button>
      </form>
    </section>
  );
}
