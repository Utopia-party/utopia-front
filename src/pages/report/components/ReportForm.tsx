import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { ReportTargetType } from '../../../types/report.ts';

interface ReportFormData {
  reportType: ReportTargetType;
  targetName: string;
  reason: string;
  details: string;
  file: File | null;
}

const REPORT_TYPES: ReportTargetType[] = ['사용자', '파티', '채팅'];

export default function ReportForm() {
  const [formData, setFormData] = useState<ReportFormData>({
    reportType: '사용자',
    targetName: '',
    reason: '욕설/비방',
    details: '',
    file: null,
  });

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
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFormData((prev) => ({ ...prev, file: selectedFile }));
  };

  const handleTypeChange = (type: ReportTargetType) => {
    setFormData((prev) => ({ ...prev, reportType: type }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('제출 데이터:', formData);
    alert('신고가 제출되었습니다.');
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">신고 등록</h2>
        <p className="mt-1 text-sm text-gray-500">
          신고 대상을 선택하고 구체적인 내용을 작성해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 신고 유형 */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">
            신고 대상
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1">
            {REPORT_TYPES.map((type) => {
              const active = formData.reportType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* 닉네임 */}
        <div className="space-y-2">
          <label
            htmlFor="targetName"
            className="block text-sm font-semibold text-gray-800"
          >
            닉네임 또는 대상명
          </label>
          <input
            id="targetName"
            type="text"
            name="targetName"
            placeholder="홍길동"
            value={formData.targetName}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* 사유 */}
        <div className="space-y-2">
          <label
            htmlFor="reason"
            className="block text-sm font-semibold text-gray-800"
          >
            신고 사유
          </label>
          <select
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="욕설/비방">욕설/비방</option>
            <option value="사기/불이행">사기/불이행</option>
            <option value="스팸/도배">스팸/도배</option>
          </select>
        </div>

        {/* 상세 내용 */}
        <div className="space-y-2">
          <label
            htmlFor="details"
            className="block text-sm font-semibold text-gray-800"
          >
            상세 내용
          </label>
          <textarea
            id="details"
            name="details"
            placeholder="언제, 어떤 상황에서 문제가 발생했는지 구체적으로 작성해주세요."
            value={formData.details}
            onChange={handleChange}
            required
            className="h-36 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <p className="text-xs text-gray-400">
            허위 신고는 제재 대상이 될 수 있습니다.
          </p>
        </div>

        {/* 파일 첨부 */}
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
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>

          {formData.file && (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
              첨부된 파일:{' '}
              <span className="font-medium">{formData.file.name}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          신고 제출
        </button>
      </form>
    </section>
  );
}
