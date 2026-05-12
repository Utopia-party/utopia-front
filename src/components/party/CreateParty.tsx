import { ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { captchaTokenStorage } from '../../apis/captchaToken';

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
  min_trust_score: number;
  captcha_pass_token: string;
}

interface CreatePartyProps {
  onCreate?: (data: CreatePartyFormData) => Promise<void>;
}

const CAPTCHA_ROUTE = '/handcaptcha';

export default function CreateParty({ onCreate }: CreatePartyProps) {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState<number>(2);
  const [minTrustScore, setMinTrustScore] = useState<number>(0);

  const selectedService =
    services.find((s) => s.id === selectedServiceId) ?? null;

  const redirectToCaptcha = (message?: string) => {
    captchaTokenStorage.clear();
    if (message) {
      toast.error(message);
    }
    navigate(CAPTCHA_ROUTE, { replace: true });
  };

  useEffect(() => {
    const passToken = captchaTokenStorage.get();

    if (!passToken) {
      redirectToCaptcha('캡챠 인증 후 3분 내에 다시 시도해주세요.');
      setLoadingServices(false);
      return;
    }

    const fetchServices = async () => {
      try {
        const res = await fetch('/api/parties/services', {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error();
        }

        const data: Service[] = await res.json();
        setServices(data);

        if (data.length > 0) {
          setSelectedServiceId(data[0].id);
          setMaxMembers(data[0].max_members);
        }
      } catch {
        toast.error('서비스 목록을 불러오지 못했습니다.');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [navigate]);

  useEffect(() => {
    if (selectedService) {
      setMaxMembers(selectedService.max_members);
    }
  }, [selectedService]);

  const handleSubmit = async () => {
    if (!selectedServiceId) {
      toast.error('서비스를 선택해주세요.');
      return;
    }

    if (title.trim().length < 2) {
      toast.error('파티명을 2자 이상 입력해주세요.');
      return;
    }

    const passToken = captchaTokenStorage.get();

    if (!passToken) {
      toast.error('캡챠 인증이 만료되었습니다. 다시 인증해주세요.');
      navigate('/captcha/handocr', { replace: true });
      return;
    }

    const payload: CreatePartyFormData = {
      service_id: selectedServiceId,
      title: title.trim(),
      description: description.trim() || undefined,
      max_members: maxMembers,
      min_trust_score: minTrustScore,
      captcha_pass_token: passToken,
    };

    try {
      setSubmitting(true);

      if (onCreate) {
        await onCreate(payload);
      } else {
        const res = await fetch('/api/parties', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const detail =
            err.detail ?? err.message ?? '파티 생성에 실패했습니다.';

          if (res.status === 403) {
            redirectToCaptcha(detail);
            return;
          }

          throw new Error(detail);
        }
      }

      captchaTokenStorage.clear();
      toast.success('파티가 생성되었습니다!');
      navigate('/mypage/party');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '파티 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-lg font-extrabold text-white">파티 생성</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            서비스를 선택하고 파티 정보를 입력해주세요
          </p>
        </div>

        {loadingServices ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={28} />
          </div>
        ) : (
          <>
            <div className="px-6 py-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
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

                {selectedService && (
                  <div className="flex gap-3 px-1">
                    <span className="text-xs text-slate-400">
                      최대 {selectedService.max_members}명
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">
                      월 {selectedService.monthly_price.toLocaleString()}원 /
                      1인
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  파티명
                </label>
                <input
                  type="text"
                  placeholder="예: Netflix 같이 봐요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  설명{' '}
                  <span className="text-slate-300 normal-case font-normal">
                    (선택)
                  </span>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  최대 인원
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input
                    type="number"
                    value={maxMembers}
                    min={2}
                    max={selectedService?.max_members ?? 10}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const max = selectedService?.max_members ?? 10;
                      if (!Number.isNaN(v)) {
                        setMaxMembers(Math.min(max, Math.max(2, v)));
                      }
                    }}
                    className="flex-1 px-4 py-3 text-sm outline-none bg-white"
                  />
                  <span className="px-3 text-sm text-slate-400 bg-slate-50 border-l border-slate-200 py-3">
                    명
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  최소 신뢰 점수{' '}
                  <span className="text-slate-300 normal-case font-normal">
                    (0 = 제한 없음)
                  </span>
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input
                    type="number"
                    value={minTrustScore}
                    min={0}
                    max={100}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v)) {
                        setMinTrustScore(Math.min(100, Math.max(0, v)));
                      }
                    }}
                    className="flex-1 px-4 py-3 text-sm outline-none bg-white"
                  />
                  <span className="px-3 text-sm text-slate-400 bg-slate-50 border-l border-slate-200 py-3">
                    점
                  </span>
                </div>
              </div>
            </div>

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
