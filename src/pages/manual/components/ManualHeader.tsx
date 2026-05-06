import { ArrowRight, BookOpenCheck, Home, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function ManualHeader() {
  const navigate = useNavigate();

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-600">
          <BookOpenCheck className="h-4 w-4" />
          Party-Up 사용 설명서
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              처음 이용할 때는
              <br className="hidden sm:block" />이 순서대로 따라하세요
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              파티를 찾고, 조건을 확인하고, 참여한 뒤 채팅방에서 정산과 결제를
              진행하는 방법을 순서대로 정리했습니다. 파티를 만들 때 필요한 AI
              행동 기반 인증 절차도 함께 안내합니다.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
            >
              홈으로 이동
              <Home className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/handcaptcha')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              파티 만들기 시작
              <PlusCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeaderSummaryCard
            title="1"
            label="로그인 및 인증"
            description="이미지 인증을 완료하고 로그인합니다."
          />
          <HeaderSummaryCard
            title="2"
            label="파티 찾기"
            description="검색 또는 카테고리로 파티를 찾습니다."
          />
          <HeaderSummaryCard
            title="3"
            label="참여 및 채팅"
            description="조건 확인 후 파티원과 소통합니다."
          />
          <HeaderSummaryCard
            title="4"
            label="정산 및 관리"
            description="결제, 신고, 내역을 확인합니다."
          />
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          <ArrowRight className="h-4 w-4 shrink-0 text-blue-600" />
          <span>
            아래 설명서는 실제 사용 흐름 기준으로 작성되어 있습니다. 위에서부터
            차례대로 읽으면 됩니다.
          </span>
        </div>
      </div>
    </section>
  );
}

type HeaderSummaryCardProps = {
  title: string;
  label: string;
  description: string;
};

function HeaderSummaryCard({
  title,
  label,
  description,
}: HeaderSummaryCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-blue-600 shadow-sm">
        {title}
      </div>
      <h2 className="font-black text-slate-950">{label}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
