import ManualSection from './ManualSection';

const statusRows = [
  ['모집중', '새 참여자를 받을 수 있거나 모집 상태로 표시되는 파티입니다.'],
  ['참여중', '내가 이미 참여하고 있는 파티입니다.'],
  ['완료', '모집 또는 참여 절차가 완료된 상태로 표시될 수 있습니다.'],
  ['마감 / 모집 마감', '정원이 찼거나 더 이상 참여할 수 없는 상태입니다.'],
  ['결제완료', '결제가 정상적으로 완료된 상태입니다.'],
  ['처리', '신고가 처리된 상태입니다.'],
  ['기각', '신고가 받아들여지지 않았거나 조치 대상이 아닌 상태입니다.'],
  ['정상', '사용자 계정 또는 멤버 상태가 정상인 상태입니다.'],
];

export default function StatusDictionarySection() {
  return (
    <ManualSection
      id="status"
      number="09"
      title="상태 표시 뜻"
      description="화면에서 자주 보이는 상태값의 의미입니다."
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-black">상태</th>
                <th className="px-5 py-4 font-black">의미</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {statusRows.map(([status, meaning]) => (
                <tr key={status}>
                  <td className="px-5 py-4 font-black text-slate-950">
                    {status}
                  </td>
                  <td className="px-5 py-4 leading-6 text-slate-600">
                    {meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ManualSection>
  );
}
