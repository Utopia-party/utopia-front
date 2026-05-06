import { Filter, RefreshCw, Search } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const findSteps = [
  {
    title: '홈 화면으로 이동합니다',
    description: '좌측 메뉴의 홈 또는 상단 버튼을 통해 홈 화면으로 이동합니다.',
    icon: Search,
  },
  {
    title: '검색창에 서비스명을 입력합니다',
    description:
      'Netflix, Disney+, Wavve, Spotify, 쿠팡처럼 원하는 서비스명을 입력해서 파티를 찾습니다.',
    icon: Search,
  },
  {
    title: '카테고리를 선택합니다',
    description:
      'OTT, 교육/도서, 음악/멤버십, 생산성/기타 등 원하는 카테고리를 선택할 수 있습니다.',
    icon: Filter,
  },
  {
    title: '필요하면 목록을 새로고침합니다',
    description:
      '새로고침 버튼을 눌러 다른 파티 목록을 다시 불러올 수 있습니다. 새로고침에는 대기 시간이 있을 수 있습니다.',
    icon: RefreshCw,
  },
];

const cardRows = [
  [
    '서비스명',
    '파티가 이용하는 구독 서비스입니다. 예: Disney+, Wavve, Spotify',
  ],
  ['모집 상태', '모집중, 완료, 마감 등 현재 참여 가능 상태입니다.'],
  ['월 1인 부담금', '한 사람이 이번 달 부담해야 하는 금액입니다.'],
  ['현재 인원', '현재 참여 인원과 최대 인원을 보여줍니다. 예: 2/4명'],
  ['조건 확인', '파티 상세 정보를 열어 참여 조건을 확인하는 버튼입니다.'],
];

export default function FindPartyManualSection() {
  return (
    <ManualSection
      id="find-party"
      number="02"
      title="파티 찾는 방법"
      description="홈 화면에서 원하는 구독 서비스를 검색하거나 카테고리별로 파티를 탐색할 수 있습니다."
    >
      <InstructionSteps steps={findSteps} />

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
        <div className="bg-slate-50 px-5 py-4">
          <h3 className="font-black text-slate-950">파티 카드 읽는 법</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-y border-slate-200 bg-white text-slate-500">
              <tr>
                <th className="px-5 py-3 font-black">항목</th>
                <th className="px-5 py-3 font-black">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {cardRows.map(([label, description]) => (
                <tr key={label}>
                  <td className="px-5 py-4 font-bold text-slate-950">
                    {label}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="검색 결과가 없을 때" variant="info">
          검색어를 더 짧게 입력하거나 카테고리를 전체로 바꿔보세요. 조건에 맞는
          파티가 없다면 직접 파티를 만들 수도 있습니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
