import { useRef } from 'react';
import { FiZap } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

// 7단계 처리 프로세스
const steps = [
  { step: '1', name: '요청 생성', desc: '사용자·서비스·이용 기간 저장 중복 요청 및 활성 파티 가입 여부 검증', table: 'quick_match_requests' },
  { step: '2', name: '하드필터', desc: '정원 초과·이미 가입·신뢰도 미달·기간 불일치·신고/정지/비활성 상태 정책 필터링', table: 'quick_match_candidates' },
  { step: '3', name: '후보 점수 계산', desc: 'rule_score와 probability_score를 계산한 뒤 final_score로 정렬', table: 'rule_score / final_score' },
  { step: '4', name: '최종 후보 선택', desc: 'final_score 1위 후보를 선택하고 결과 스냅샷 저장', table: 'quick_match_results' },
  { step: '5', name: '실제 가입', desc: '선택 파티에 PartyMember를 생성하고 빠른매칭 가입 이벤트 기록', table: 'party_members / training_events' },
  { step: '6', name: '운영 결과 수집', desc: '정산·탈퇴·강퇴·신고·제재·유지기간 데이터 누적', table: 'result_snapshot' },
  { step: '7', name: '라벨링 / 통계 집계', desc: 'pending 이벤트를 success/failed/excluded로 확정 후 통계 테이블 재집계', table: 'quick_match_training_stats' },
];

// 점수 산식
const scores = [
  {
    name: 'rule_score',
    formula: '신뢰도 40% + 인원 여유 30% + 이용 기간 30%',
    desc: '현재 후보가 조건상 얼마나 적합한지 계산하는 규칙 기반 점수',
    weight: '55%',
    color: 'border-green-200 bg-green-50',
    tagColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'probability_score',
    formula: '서비스별 35% + 신뢰도 구간별 35% + 기간 매칭 20% + 인원 여유 10%',
    desc: '과거 라벨링된 학습 이벤트를 집계해 얻은 통계 기반 성공 확률',
    weight: '45%',
    color: 'border-blue-200 bg-blue-50',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'final_score',
    formula: 'rule_score × 55% + probability_score × 45%',
    desc: '후보 정렬과 최종 1위 선택에 사용하는 최종 점수',
    weight: '최종',
    color: 'border-indigo-200 bg-indigo-50',
    tagColor: 'bg-indigo-100 text-indigo-700',
  },
];

// 라벨 분포
const labels = [
  { label: 'success', count: 5058, pct: 62.5, color: 'bg-emerald-400', desc: '30일 유지, 정산 성공, 신고/제재/탈퇴/강퇴 없음', used: true },
  { label: 'failed', count: 2954, pct: 28.3, color: 'bg-rose-400', desc: '3일 내 탈퇴/강퇴, 정산 실패/노쇼, 신고/제재 발생', used: true },
  { label: 'pending', count: 512, pct: 4.9, color: 'bg-amber-300', desc: '관찰 기간 미종료 상태', used: false },
  { label: 'excluded', count: 1927, pct: 18.5, color: 'bg-gray-300', desc: '선택되지 않은 후보, 시스템/운영 이슈', used: false },
];

// 통계 집계 축
const statAxes = [
  { key: 'global', example: 'all', desc: '전체 평균 성공률 표본 부족 bucket의 fallback 기준' },
  { key: 'service', example: 'service_id', desc: '서비스별 성공률 반영' },
  { key: 'trust_bucket', example: 'under_30 / 30_40 / 40_50 / 50_60 / over_60', desc: '신뢰도 구간별 성공률 반영' },
  { key: 'duration_match', example: 'exact / overlap / boundary / mismatch', desc: '선호 기간과 파티 기간 적합도별 성공률' },
  { key: 'capacity_bucket', example: 'high / medium / low / full', desc: '남은 자리 비율에 따른 성공률' },
];

export default function QuickMatchMLSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  const totalLabeled = labels.filter((l) => l.used).reduce((s, l) => s + l.count, 0);

  return (
    <section ref={sectionRef} id="quickmatch-ml" className="py-20 md:py-32 bg-white">
      {/* 헤더 */}
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-sm font-bold mb-6">
          <FiZap /> 빠른매칭 학습 파이프라인
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          규칙 기반 → 통계 기반 점진적 전환
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">
            빠른매칭 데이터 파이프라인
          </span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          실제 운영 데이터가 부족한 초기에는 규칙 기반 점수를 중심으로 동작하고,
          운영 로그가 쌓이면 통계 기반 probability_score 비중을 점진적으로 높이는 구조입니다.
        </p>
      </div>

      {/* 7단계 파이프라인 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-green-500 inline-block" />
          7단계 처리 프로세스
        </h3>
        <div className="timeline-group relative pl-8">
          <div className="timeline-line absolute left-3 top-2 bottom-2 w-0.5 bg-green-200 rounded-full" />
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.step} className="timeline-item relative">
                <div className="absolute -left-8 top-4 w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center">
                  <span className="text-[9px] text-white font-black">{s.step}</span>
                </div>
                <div className="hover-lift rounded-2xl border border-gray-100 bg-white shadow-sm p-5 will-change-transform">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{s.name}</p>
                    <span className="md:ml-auto px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-mono">{s.table}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 점수 산식 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-green-500 inline-block" />
          점수 산식 (rule + probability → final)
        </h3>
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {scores.map((s) => (
            <div key={s.name} className={`hover-lift rounded-2xl border p-6 will-change-transform ${s.color}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-gray-900 font-mono">{s.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.tagColor}`}>{s.weight}</span>
              </div>
              <p className="text-xs font-semibold text-gray-600 mb-3 leading-relaxed">{s.formula}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 라벨 분포 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-green-500 inline-block" />
          라벨 분포 (총 10,451건 seed 데이터)
        </h3>

        {/* 통합 바 */}
        <div className="flex rounded-xl overflow-hidden h-5 mb-4">
          {labels.map((l) => (
            <div
              key={l.label}
              className={`${l.color} h-full`}
              style={{ width: `${(l.count / 10451) * 100}%` }}
              title={`${l.label}: ${l.count}건`}
            />
          ))}
        </div>

        <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          {labels.map((l) => (
            <div
              key={l.label}
              className={`hover-lift rounded-2xl border p-5 will-change-transform ${
                l.used ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-3 h-3 rounded-full ${l.color}`} />
                <p className="font-black text-gray-900">{l.label}</p>
                <span
                  className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    l.used ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {l.used ? '통계 반영' : '제외'}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 mb-1">{l.count.toLocaleString()}건</p>
              <p className="text-xs text-gray-500">{l.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          success + failed({totalLabeled.toLocaleString()}건)만 통계 기반 성공률 계산에 사용.
          pending은 관찰 기간 종료 전 보류, excluded는 매칭 품질 판단 제외.
        </p>
      </div>

      {/* 통계 집계 축 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-green-500 inline-block" />
          probability_score 통계 집계 축
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full min-w-[480px] text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['집계 축', '예시 key', '활용 방식'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {statAxes.map((a) => (
                <tr key={a.key} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-bold text-green-700 font-mono">{a.key}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.example}</td>
                  <td className="px-4 py-3 text-gray-600">{a.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 로드맵 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-green-500 inline-block" />
          운영 데이터 누적 → ML 전환 로드맵
        </h3>
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              phase: '초기 (현재)',
              title: '하드필터 + 규칙 기반',
              desc: 'rule_score 55% 비중 실서비스 운영 후 success/failed 라벨 데이터 확보 시작',
              color: 'border-gray-200 bg-gray-50',
              tag: 'rule_score 중심',
              tagColor: 'bg-gray-100 text-gray-600',
            },
            {
              phase: '중기',
              title: '표본 충분한 bucket부터 반영',
              desc: 'probability_score 신뢰도 점진적 향상 seed 데이터와 실제 운영 데이터 분리 관리',
              color: 'border-green-200 bg-green-50',
              tag: 'probability 점진 반영',
              tagColor: 'bg-green-100 text-green-700',
            },
            {
              phase: '장기',
              title: 'ML 확률매칭 모델 적용',
              desc: '충분한 실제 데이터 누적 이후 ML 모델 적용 여부 검토 final_score 가중치 재조정',
              color: 'border-teal-200 bg-teal-50',
              tag: 'ML 모델 검토',
              tagColor: 'bg-teal-100 text-teal-700',
            },
          ].map((p) => (
            <div key={p.phase} className={`hover-lift rounded-2xl border p-6 will-change-transform ${p.color}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400">{p.phase}</p>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.tagColor}`}>{p.tag}</span>
              </div>
              <p className="font-bold text-gray-900 mb-2">{p.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
