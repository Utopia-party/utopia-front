import { Search, Zap, CheckCircle2, X, RefreshCw } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const quickMatchSteps = [
  {
    title: '홈에서 빠른매칭 버튼을 누릅니다',
    description:
      '홈 화면 상단의 빠른매칭 버튼을 누르면 빠른매칭 신청 화면으로 이동합니다.',
    icon: Zap,
  },
  {
    title: '원하는 서비스를 선택합니다',
    description:
      'Netflix, Spotify 등 참여하고 싶은 구독 서비스를 선택합니다. 이미 해당 서비스의 활성 파티에 참여 중이면 신청할 수 없습니다.',
    icon: Search,
  },
  {
    title: '매칭 신청을 제출합니다',
    description:
      '서비스 선택 후 매칭 신청 버튼을 누르면 시스템이 조건에 맞는 파티를 자동으로 탐색합니다.',
    icon: Zap,
  },
  {
    title: '매칭 결과를 확인합니다',
    description:
      '매칭이 완료되면 추천된 파티 정보(서비스명, 인원, 금액 등)가 표시됩니다. 마음에 들면 참여 확정을, 다시 찾으려면 재탐색을 누릅니다.',
    icon: CheckCircle2,
  },
  {
    title: '참여 확정 또는 취소를 선택합니다',
    description:
      '참여 확정을 누르면 해당 파티에 즉시 참여됩니다. 취소를 누르면 매칭이 해제되고 다시 탐색할 수 있습니다.',
    icon: CheckCircle2,
  },
];

const statusRows = [
  ['대기중', '매칭 요청이 접수되어 파티를 탐색 중입니다.'],
  ['매칭완료', '조건에 맞는 파티를 찾았습니다. 참여 확정 또는 취소를 선택하세요.'],
  ['참여확정', '파티 참여가 완료되었습니다.'],
  ['취소', '매칭을 취소하거나 요청이 만료된 상태입니다.'],
];

export default function QuickMatchManualSection() {
  return (
    <ManualSection
      id="quick-match"
      number="03-1"
      title="빠른매칭 이용 방법"
      description="조건에 맞는 파티를 직접 찾는 대신 AI가 자동으로 추천해주는 빠른매칭을 이용할 수 있습니다."
    >
      <InstructionSteps steps={quickMatchSteps} />

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
        <div className="bg-slate-50 px-5 py-4">
          <h3 className="font-black text-slate-950">빠른매칭 상태 의미</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-y border-slate-200 bg-white text-slate-500">
              <tr>
                <th className="px-5 py-3 font-black">상태</th>
                <th className="px-5 py-3 font-black">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {statusRows.map(([status, desc]) => (
                <tr key={status}>
                  <td className="px-5 py-4 font-bold text-slate-950">{status}</td>
                  <td className="px-5 py-4 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <X className="h-5 w-5 text-rose-500" />
            <h3 className="font-black text-slate-950">신청할 수 없는 경우</h3>
          </div>
          <ul className="grid gap-2 text-sm leading-6 text-slate-600">
            <li>• 이미 진행 중인 빠른매칭 요청이 있을 때</li>
            <li>• 해당 서비스의 활성 파티에 이미 참여 중일 때</li>
            <li>• 계정이 정지되었거나 비활성 상태일 때</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-slate-950">파티를 찾지 못했을 때</h3>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            현재 모집 중인 파티가 없거나 조건에 맞는 파티가 없을 수 있습니다.
            잠시 후 다시 시도하거나 홈에서 직접 파티를 검색해 보세요.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="빠른매칭과 직접 참여의 차이" variant="info">
          빠른매칭은 AI가 조건에 맞는 파티를 자동으로 추천해주는 방식입니다.
          방장의 별도 승인 없이 즉시 참여 확정이 가능하며, 직접 파티를
          탐색하는 시간을 줄일 수 있습니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
