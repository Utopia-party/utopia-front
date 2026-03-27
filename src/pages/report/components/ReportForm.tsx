import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { ReportTargetType } from '../../../types/report.ts';

// 폼 데이터 타입 정의
interface ReportFormData {
  reportType: ReportTargetType;
  targetName: string;
  reason: string;
  details: string;
  file: File | null;
}

export default function ReportForm() {
  // 1. 상태 통합
  const [formData, setFormData] = useState<ReportFormData>({
    reportType: '사용자',
    targetName: '',
    reason: '욕설/비방',
    details: '',
    file: null,
  });

  // 2. 범용 입력 핸들러 (Input, Select, Textarea 공용)
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. 파일 전용 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFormData((prev) => ({ ...prev, file: selectedFile }));
  };

  // 4. 신고 유형 변경 (버튼 클릭 전용)
  const handleTypeChange = (type: ReportTargetType) => {
    setFormData((prev) => ({ ...prev, reportType: type }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('제출 데이터:', formData);
    alert('신고가 제출되었습니다.');
  };

  return (
    <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6">신고 등록</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. 신고 대상 유형 (버튼) */}
        <div className="flex gap-2">
          {(['사용자', '파티', '채팅'] as ReportTargetType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                formData.reportType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type} 신고
            </button>
          ))}
        </div>

        {/* 2. 닉네임 입력 (name 속성 추가) */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-800">
            닉네임
          </label>
          <input
            type="text"
            name="targetName" // formData의 키값과 일치
            placeholder="예: user_02"
            value={formData.targetName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 3. 사유 선택 (name 속성 추가) */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-800">사유</label>
          <select
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="욕설/비방">욕설/비방</option>
            <option value="사기/불이행">사기/불이행</option>
            <option value="스팸/도배">스팸/도배</option>
          </select>
        </div>

        {/* 4. 상세 내용 (name 속성 추가) */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-800">
            상세 내용
          </label>
          <textarea
            name="details"
            placeholder="구체적인 상황을 적어주세요"
            value={formData.details}
            onChange={handleChange}
            required
            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 5. 증빙 첨부 */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-800">
            증빙 첨부(선택)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 hover:file:bg-gray-200"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors mt-8"
        >
          신고 제출
        </button>
      </form>
    </div>
  );
}
