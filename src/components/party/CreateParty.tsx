import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

interface CreatePartyProps {
  onCreate?: (data: CreatePartyFormData) => void;
}

export interface CreatePartyFormData {
  title: string;
  maxMembers: string;
  partyType: string;
  platformType: string;
  priceDisplay: string;
}

const MAX_MEMBER_OPTIONS = ['2명', '3명', '4명', '5명', '6명'];
const PARTY_TYPE_OPTIONS = ['구독', '공동구매', '렌탈', '기타'];
const PLATFORM_TYPE_OPTIONS = ['OTT', '멤버십/음악', '교육/도서', '생산성', '기타'];
const PRICE_DISPLAY_OPTIONS = ['1인당 표시', '총액 표시', '숨김'];

export default function CreateParty({ onCreate }: CreatePartyProps) {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  const [form, setForm] = useState<CreatePartyFormData>({
    title: '',
    maxMembers: '4명',
    partyType: '구독',
    platformType: 'OTT',
    priceDisplay: '1인당 표시',
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert('파티명을 입력해주세요.');
      return;
    }
    onCreate?.(form);
    goBack();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-lg font-extrabold text-white">파티 생성</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            인원 / 파티 유형 / 플랫폼 유형 / 가격 표시 선택
          </p>
        </div>

        {/* 폼 */}
        <div className="px-6 py-6 flex flex-col gap-5">
          {/* 파티명 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              파티명
            </label>
            <input
              type="text"
              placeholder="예: Netflix 프리미엄 4인"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* 인원 체크 */}
          <SelectField
            label="인원 체크(정원)"
            value={form.maxMembers}
            options={MAX_MEMBER_OPTIONS}
            onChange={(v) => setForm((prev) => ({ ...prev, maxMembers: v }))}
          />

          {/* 파티 유형 */}
          <SelectField
            label="파티 유형"
            value={form.partyType}
            options={PARTY_TYPE_OPTIONS}
            onChange={(v) => setForm((prev) => ({ ...prev, partyType: v }))}
          />

          {/* 플랫폼 유형 */}
          <SelectField
            label="플랫폼 유형"
            value={form.platformType}
            options={PLATFORM_TYPE_OPTIONS}
            onChange={(v) => setForm((prev) => ({ ...prev, platformType: v }))}
          />

          {/* 가격 표시 */}
          <SelectField
            label="가격 표시"
            value={form.priceDisplay}
            options={PRICE_DISPLAY_OPTIONS}
            onChange={(v) => setForm((prev) => ({ ...prev, priceDisplay: v }))}
          />
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              생성 완료
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center">
            생성 후: 채팅방 자동 생성 + 멤버/정산/영수증/신고 기능 제공
          </p>
          <p className="text-xs text-slate-300 text-center">ESC 키로 닫기 불가(데모 UI)</p>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
    </div>
  );
}
