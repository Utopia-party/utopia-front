import { CheckCircle2, Hand, ShieldCheck } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const joinSteps = [
  {
    title: '파티 카드에서 조건 확인을 누릅니다',
    description:
      '관심 있는 파티 카드의 조건 확인 버튼을 눌러 파티 상세 모달을 엽니다.',
    icon: CheckCircle2,
  },
  {
    title: '금액과 인원을 확인합니다',
    description:
      '서비스 월 요금, 1인 부담금, 모집 인원, 현재 인원이 본인에게 맞는지 확인합니다.',
    icon: CheckCircle2,
  },
  {
    title: '방장 정보와 신뢰도를 확인합니다',
    description: '방장 닉네임, 방장 신뢰도, 최소 신뢰도 조건을 확인합니다.',
    icon: ShieldCheck,
  },
  {
    title: '참여 가능 상태이면 참여합니다',
    description:
      '참여 버튼이 활성화되어 있으면 파티 참여를 진행합니다. 참여중으로 표시되면 이미 참여한 파티입니다.',
    icon: Hand,
  },
];

const detailRows = [
  ['모집 인원', '현재 몇 명이 참여했고 최대 몇 명까지 가능한지 확인합니다.'],
  ['파티 생성일', '파티가 언제 생성되었는지 확인합니다.'],
  ['시작일/종료일', '구독 공유가 시작되고 종료되는 날짜입니다.'],
  [
    '최소 신뢰도',
    '참여에 필요한 최소 신뢰도 조건입니다. 제한 없음으로 표시될 수도 있습니다.',
  ],
  ['정산 주기', '매월 1일처럼 정산이 이루어지는 기준입니다.'],
  ['방장 신뢰도', '파티를 운영하는 사용자의 신뢰도입니다.'],
];

export default function JoinPartyManualSection() {
  return (
    <ManualSection
      id="join-party"
      number="03"
      title="파티 조건 확인 후 참여하는 방법"
      description="파티에 참여하기 전에는 금액, 인원, 정산 주기, 방장 신뢰도를 반드시 확인하세요."
    >
      <InstructionSteps steps={joinSteps} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-black text-slate-950">
            상세 모달에서 확인할 항목
          </h3>
          <div className="mt-4 grid gap-3">
            {detailRows.map(([label, description]) => (
              <div key={label} className="rounded-2xl bg-white p-4">
                <p className="font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-black text-slate-950">참여 버튼 상태 이해하기</h3>
          <div className="mt-4 grid gap-3">
            <StatusMiniCard
              label="참여하기"
              description="조건 확인 후 참여를 신청하거나 참여할 수 있는 상태입니다."
              tone="blue"
            />
            <StatusMiniCard
              label="참여중"
              description="이미 내가 참여한 파티입니다. 내 파티 또는 채팅방에서 이어서 이용하세요."
              tone="green"
            />
            <StatusMiniCard
              label="모집 마감"
              description="정원이 찼거나 모집이 종료되어 새로 참여할 수 없는 상태입니다."
              tone="slate"
            />
            <StatusMiniCard
              label="완료"
              description="모집이나 운영 단계가 완료된 파티로 표시될 수 있습니다."
              tone="slate"
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="참여 전 확인해야 할 것" variant="warning">
          1인 부담금, 정산 주기, 종료일, 방장 신뢰도, 최소 신뢰도 조건을 확인한
          뒤 참여하세요.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}

type StatusMiniCardProps = {
  label: string;
  description: string;
  tone: 'blue' | 'green' | 'slate';
};

function StatusMiniCard({ label, description, tone }: StatusMiniCardProps) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass}`}
      >
        {label}
      </span>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
