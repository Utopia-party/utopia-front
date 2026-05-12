import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import ManualSection from './ManualSection';
import ManualCallout from './ManualCallout';

const gainRows = [
  ['장기 파티 유지 (멤버)', '+1 / +3 / +5점', '2 / 4 / 6개월 연속 유지 시'],
  ['장기 파티 유지 (방장)', '+2 / +4 / +6점', '2 / 4 / 6개월 방장 유지 시'],
  ['매너 칭찬 수신', '+0.1점 (월 최대 +2점)', '다른 유저로부터 칭찬 수신 시'],
];

const lossRows = [
  ['욕설 / 비방', '-1 / -5점', '순화된 욕설 -1점, 심한 욕설 -5점'],
  ['결제 지연', '-5점', '정해진 결제 기간 초과 시'],
  ['단순 비매너 신고', '-1점', '운영 신고 접수 후 처리 시'],
  ['스팸·중대 위반 신고', '-5점', '스팸, 사기 등 중대 위반 처리 시'],
  ['노쇼', '-5점', '파티 시작 후 미참여 확인 시'],
];

const banRows = [
  ['20~30점', '1차 경고', '파티 생성·참여 시 주의 문구 노출'],
  ['10~20점', '경고 누적', '2단계 행동 인증 강제 발동 / 신규 파티 참여 제한'],
  ['10점 미만', '서비스 정지', '경고 3회 누적 시 30일 이용 정지 / 모든 파티 강제 탈퇴'],
  ['0점', '영구 추방', '경고 4회 누적 시 IP 및 기기 기반 영구 차단'],
];

export default function TrustScoreManualSection() {
  return (
    <ManualSection
      id="trust-score"
      number="09-1"
      title="신뢰도 점수 안내"
      description="모든 사용자는 0~99점의 신뢰도 점수를 가지며, 기본 시작 점수는 36.5점입니다. 점수에 따라 이용 가능한 기능이 달라집니다."
    >
      {/* 가점 */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h3 className="font-black text-slate-950">점수가 오르는 경우 (가점)</h3>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-emerald-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-black">항목</th>
                  <th className="px-5 py-3 font-black">점수 변동</th>
                  <th className="px-5 py-3 font-black">기준</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {gainRows.map(([item, score, criteria]) => (
                  <tr key={item}>
                    <td className="px-5 py-4 font-bold text-slate-950">{item}</td>
                    <td className="px-5 py-4 font-bold text-emerald-600">{score}</td>
                    <td className="px-5 py-4 text-slate-600">{criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 감점 */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-rose-500" />
          <h3 className="font-black text-slate-950">점수가 내려가는 경우 (감점)</h3>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-rose-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-black">항목</th>
                  <th className="px-5 py-3 font-black">점수 변동</th>
                  <th className="px-5 py-3 font-black">기준</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lossRows.map(([item, score, criteria]) => (
                  <tr key={item}>
                    <td className="px-5 py-4 font-bold text-slate-950">{item}</td>
                    <td className="px-5 py-4 font-bold text-rose-600">{score}</td>
                    <td className="px-5 py-4 text-slate-600">{criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 이용 제한 구간 */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          <h3 className="font-black text-slate-950">점수 구간별 이용 제한</h3>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-amber-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-black">점수 구간</th>
                  <th className="px-5 py-3 font-black">단계</th>
                  <th className="px-5 py-3 font-black">제한 내용</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {banRows.map(([range, level, restriction]) => (
                  <tr key={range}>
                    <td className="px-5 py-4 font-bold text-slate-950">{range}</td>
                    <td className="px-5 py-4 font-bold text-amber-600">{level}</td>
                    <td className="px-5 py-4 text-slate-600">{restriction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ManualCallout title="매너 칭찬 어뷰징 방지" variant="info">
        동일 유저 간 반복 칭찬, 자작 계정을 통한 점수 조작을 방지하기 위해
        매너 칭찬으로 받을 수 있는 점수는 월 최대 +2점으로 제한됩니다.
      </ManualCallout>
    </ManualSection>
  );
}
