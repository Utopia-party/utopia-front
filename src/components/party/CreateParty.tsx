import { ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';

// ── 타입 ─────────────────────────────────────────────────────
interface Service {
  id: string;
  name: string;
  category: string;
  max_members: number;
  monthly_price: number;
  logo_image_url: string | null;
}

export interface CreatePartyFormData {
  service_id: string;
  title: string;
  description?: string;
  max_members: number;
  monthly_per_person: number;
  min_trust_score: number;
}

interface CreatePartyProps {
  onCreate?: (data: CreatePartyFormData) => Promise<void>;
}

// ── 컴포넌트 ─────────────────────────────────────────────────
export default function CreateParty({ onCreate }: CreatePartyProps) {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState<number>(2);
  const [monthlyPerPerson, setMonthlyPerPerson] = useState<number>(0);
  const [minTrustScore, setMinTrustScore] = useState<number>(0);

  // 선택된 서비스 객체
  const selectedService = services.find((s) => s.id === selectedServiceId) ?? null;

  // ── 서비스 목록 로드 ────────────────────────────────────────
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/parties/services', { credentials: 'include' });
        if (!res.ok) throw new Error('서비스 목록 로드 실패');
        const data: Service[] = await res.json();
        setServices(data);
        if (data.length > 0) {
          setSelectedServiceId(data[0].id);
          setMaxMembers(data[0].max_members);
          setMonthlyPerPerson(data[0].monthly_price);
        }
      } catch {
        toast.error('서비스 목록을 불러오지 못했습니다.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // 서비스 변경 시 max_members, monthly_per_person 자동 채우기
  useEffect(() => {
    if (selectedService) {
      setMaxMembers(selectedService.max_members);
      setMonthlyPerPerson(selectedService.monthly_price);
    }
  }, [selectedServiceId]);

  // ── 제출 ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedServiceId) {
      toast.error('서비스를 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      toast.error('파티명을 입력해주세요.');
      return;
    }
    if (title.trim().length < 2) {
      toast.error('파티명은 2자 이상 입력해주세요.');
      return;
    }

    const payload: CreatePartyFormData = {
      service_id: selectedServiceId,
      title: title.trim(),
      description: description.trim() || undefined,
      max_members: maxMembers,
      monthly_per_person: monthlyPerPerson,
      min_trust_score: minTrustScore,
    };

    try {
      setSubmitting(true);
      if (onCreate) {
        await onCreate(payload);
      } else {
        // onCreate 없을 때 직접 호출
        const res = await fetch('/api/parties', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? '파티 생성에 실패했습니다.');
        }
      }
      toast.success('파티가 생성되었습니다!');
      navigate('/home');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '파티 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 렌더 ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-lg font-extrabold text-white">파티 생성</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            서비스 선택 후 파티 정보를 입력해주세요
          </p>
        </div>

        {loadingServices ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={28} />
          </div>
        ) : (
          <>
            {/* 폼 */}
            <div className="px-6 py-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">

              {/* 서비스 선택 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  서비스 선택
                </label>
                <div className="relative">
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white cursor-pointer"
                  >
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} ({svc.category})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                {/* 선택된 서비스 정보 */}
                {selectedService && (
                  <p className="text-xs text-slate-400 pl-1">
                    최대 {selectedService.max_members}명 · 월{' '}
                    {selectedService.monthly_price.toLocaleString()}원
                  </p>
                )}
              </div>

              {/* 파티명 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  파티명
                </label>
                <input
                  type="text"
                  placeholder="예: Netflix 프리미엄 같이해요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                />
              </div>

              {/* 설명 (선택) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  설명 <span className="text-slate-300 normal-case">(선택)</span>
                </label>
                <textarea
                  placeholder="파티에 대해 간략히 설명해주세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>

              {/* 최대 인원 */}
              <NumberField
                label="최대 인원"
                value={maxMembers}
                min={2}
                max={selectedService?.max_members ?? 10}
                onChange={setMaxMembers}
                suffix="명"
              />

              {/* 1인당 월 금액 */}
              <NumberField
                label="1인당 월 금액 (원)"
                value={monthlyPerPerson}
                min={0}
                max={999999}
                onChange={setMonthlyPerPerson}
                suffix="원"
              />

              {/* 최소 신뢰 점수 */}
              <NumberField
                label="최소 신뢰 점수"
                value={minTrustScore}
                min={0}
                max={100}
                onChange={setMinTrustScore}
                suffix="점"
              />
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 pb-6 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  닫기
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  생성 완료
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center">
                생성 후: 채팅방 자동 생성 + 멤버/정산/영수증/신고 기능 제공
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 숫자 입력 필드 ────────────────────────────────────────────
function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="flex-1 px-4 py-3 text-sm outline-none bg-white"
        />
        {suffix && (
          <span className="px-3 text-sm text-slate-400 bg-slate-50 border-l border-slate-200 py-3">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
