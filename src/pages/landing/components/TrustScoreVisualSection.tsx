import { useRef } from 'react';
import { FiTrendingUp, FiTrendingDown, FiShield } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const gainItems = [
  { label: '장기 파티 유지 (멤버)', score: '+1~+5점', sub: '2/4/6개월 연속 유지', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: '장기 파티 유지 (방장)', score: '+2~+6점', sub: '2/4/6개월 방장 유지', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: '매너 칭찬 수신', score: '+0.1점', sub: '월 최대 +2점 상한', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const lossItems = [
  { label: '욕설 / 비방', score: '-1 ~ -5점', sub: '순화·심한 욕설 구분', color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: '결제 지연', score: '-5점', sub: '정해진 기간 초과 시', color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: '노쇼', score: '-5점', sub: '파티 시작 후 미참여', color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: '신고 처리', score: '-1 ~ -5점', sub: '단순비매너 ~ 중대위반', color: 'text-rose-600', bg: 'bg-rose-50' },
];

const banLevels = [
  { range: '30~99점', label: '정상', desc: '모든 기능 이용 가능', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', barColor: 'bg-emerald-400', barWidth: '70%' },
  { range: '20~30점', label: '1차 경고', desc: '파티 생성·참여 시 주의 문구', color: 'bg-amber-100 text-amber-700 border-amber-200', barColor: 'bg-amber-400', barWidth: '30%' },
  { range: '10~20점', label: '경고 누적', desc: '행동 인증 강제 + 신규 참여 제한', color: 'bg-orange-100 text-orange-700 border-orange-200', barColor: 'bg-orange-400', barWidth: '20%' },
  { range: '10점 미만', label: '서비스 정지', desc: '30일 정지 + 모든 파티 강제 탈퇴', color: 'bg-red-100 text-red-700 border-red-200', barColor: 'bg-red-400', barWidth: '10%' },
  { range: '0점', label: '영구 추방', desc: 'IP·기기 Fingerprint 영구 차단', color: 'bg-gray-900 text-white border-gray-700', barColor: 'bg-gray-700', barWidth: '2%' },
];

export default function TrustScoreVisualSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="trust" className="py-20 md:py-32 bg-white">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold mb-6">
          <FiShield size={13} /> 신뢰도 시스템
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          모든 활동이 점수가 됩니다
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">
            신뢰도 점수 0~99 설계
          </span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          기본 시작 점수 <strong className="text-gray-700">36.5점</strong> (정상 체온 모티프).
          정상 활동으로 점수가 오르고, 위반 시 자동으로 제재가 발동됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
        {/* 가점 */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <FiTrendingUp className="text-emerald-500" size={20} />
            <h3 className="text-lg font-bold text-gray-900">점수 올리기</h3>
          </div>
          <div className="flex flex-col gap-3">
            {gainItems.map((item) => (
              <div key={item.label} className={`flex items-center justify-between rounded-2xl border p-4 ${item.bg} border-emerald-100`}>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                </div>
                <span className={`font-black text-lg ${item.color}`}>{item.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 감점 */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <FiTrendingDown className="text-rose-500" size={20} />
            <h3 className="text-lg font-bold text-gray-900">점수 깎이기</h3>
          </div>
          <div className="flex flex-col gap-3">
            {lossItems.map((item) => (
              <div key={item.label} className={`flex items-center justify-between rounded-2xl border p-4 ${item.bg} border-rose-100`}>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                </div>
                <span className={`font-black text-lg ${item.color}`}>{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 구간별 제재 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiShield className="text-amber-500" />
          점수 구간별 자동 제재
        </h3>
        <div className="flex flex-col gap-3">
          {banLevels.map((level) => (
            <div key={level.range} className={`flex items-center gap-4 rounded-2xl border p-4 ${level.range === '0점' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="w-24 shrink-0">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black border ${level.color}`}>
                  {level.label}
                </span>
              </div>
              <div className="w-20 shrink-0 text-xs font-bold text-gray-500">{level.range}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                  <div className={`${level.barColor} h-1.5 rounded-full transition-all`} style={{ width: level.barWidth }} />
                </div>
                <p className={`text-xs ${level.range === '0점' ? 'text-gray-400' : 'text-gray-600'}`}>{level.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
