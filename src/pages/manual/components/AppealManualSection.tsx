import { FileText, Send, Clock, CheckCircle2 } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const appealSteps = [
  {
    title: '이의신청 페이지로 이동합니다',
    description:
      '계정이 정지되거나 제한된 경우 이의신청 버튼 또는 해당 메뉴를 통해 이의신청 화면으로 이동합니다.',
    icon: FileText,
  },
  {
    title: '제재 유형을 확인합니다',
    description:
      '내 계정에 적용된 제재 유형(신뢰도 점수, IP 차단, 신고 처리 등)을 확인합니다.',
    icon: FileText,
  },
  {
    title: '이의신청 사유를 작성합니다',
    description:
      '제재가 부당하다고 생각하는 이유를 구체적으로 작성합니다. 관련 상황, 날짜, 파티 정보 등을 포함하면 검토에 도움이 됩니다.',
    icon: FileText,
  },
  {
    title: '이의신청을 제출합니다',
    description:
      '작성이 완료되면 제출 버튼을 눌러 관리자에게 이의신청을 전달합니다.',
    icon: Send,
  },
  {
    title: '처리 결과를 기다립니다',
    description:
      '관리자 검토 후 승인 또는 기각 결과가 알림으로 전송됩니다. 처리까지 시간이 걸릴 수 있습니다.',
    icon: Clock,
  },
];

const appealStatusRows = [
  ['대기중', '이의신청이 접수되어 관리자 검토를 기다리는 상태입니다.'],
  ['승인', '이의신청이 받아들여져 제재가 해제 또는 완화된 상태입니다.'],
  ['기각', '이의신청이 받아들여지지 않아 제재가 유지되는 상태입니다.'],
];

const banTypes = [
  ['신뢰도 점수 제재', '신뢰도 점수 하락으로 인한 기능 제한'],
  ['IP 차단', '동일 IP의 반복 위반으로 인한 접근 차단'],
  ['수동 제재', '관리자가 직접 처리한 제재'],
  ['신고 처리 제재', '신고 누적 처리로 인한 제재'],
];

export default function AppealManualSection() {
  return (
    <ManualSection
      id="appeal"
      number="11"
      title="이의신청 방법"
      description="계정 정지나 이용 제한이 부당하다고 생각될 경우 이의신청을 통해 관리자 재검토를 요청할 수 있습니다."
    >
      <InstructionSteps steps={appealSteps} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-slate-950">이의신청 처리 결과</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black">상태</th>
                  <th className="px-4 py-3 font-black">의미</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-slate-50">
                {appealStatusRows.map(([status, desc]) => (
                  <tr key={status}>
                    <td className="px-4 py-3 font-bold text-slate-950">{status}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs leading-6">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-black text-slate-950 mb-4">이의신청 가능한 제재 유형</h3>
          <div className="grid gap-2">
            {banTypes.map(([type, desc]) => (
              <div key={type} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-950">{type}</p>
                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="이의신청 시 유의사항" variant="warning">
          이의신청은 제재 유형별로 1회 접수됩니다. 허위 사실을 기재하거나
          반복적으로 남용할 경우 추가 제재가 발생할 수 있습니다. 처리 결과는
          알림으로 전달되며, 승인 시 계정 제한이 해제됩니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
