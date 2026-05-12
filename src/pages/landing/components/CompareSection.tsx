import { useRef } from 'react';
import { FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const rows = [
  { category: '보안 체계', sns: '없음 (완전 익명)', general: '1회성 본인인증', partyup: 'AI 기반 실시간 동적 검증 (3단계)', snsBad: true, generalBad: true },
  { category: '신뢰 관리', sns: '사용자 판단', general: '신고 후 사후 차단', partyup: '위험 점수 기반 사전 탐지 (0~99점)', snsBad: true, generalBad: true },
  { category: '정산 방식', sns: '개인 간 계좌이체', general: '플랫폼 직접 결제', partyup: '에스크로 선결제 후 정산 시스템', snsBad: true, generalBad: false },
  { category: '분쟁 해결', sns: '개인 해결 불가', general: '고객센터 수동 개입', partyup: 'AI 자동 분쟁 조정 (채팅 로그 근거)', snsBad: true, generalBad: true },
  { category: '봇/사기 차단', sns: '불가', general: '제한적', partyup: 'GAN·LSTM·MediaPipe 다층 차단', snsBad: true, generalBad: true },
  { category: '채팅 보안', sns: '없음', general: '없음', partyup: 'KR-ELECTRA + Ollama 실시간 탐지', snsBad: true, generalBad: true },
];

const problems = [
  { title: '먹튀 사기', desc: '입금 후 잠적. SNS 기반 거래에서 연간 20만 건 이상 발생.' },
  { title: '노쇼 (No-show)', desc: '파티 참여 후 미결제, 미참여로 피해 발생.' },
  { title: '봇 대량 계정', desc: '자동화 스크립트로 파티 독점, 어뷰징.' },
  { title: '분쟁 해결 불가', desc: '개인 간 거래라 증거 없이 해결 방법이 없음.' },
];

export default function CompareSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="compare" className="py-20 md:py-32 bg-gray-50/50">
      <div className="section-header flex flex-col items-center text-center mb-16">

        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          기존 플랫폼의 한계,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
            Party-Up이 구조적으로 해결합니다
          </span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          경찰청 통계 기준 온라인 직거래 사기는 연간 20만 건 이상.
          서비스 이용권 사기는 매년 15% 이상 증가 중입니다.
        </p>
      </div>

      {/* 기존 문제점 */}
      <div className="stagger-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {problems.map((p) => (
          <div key={p.title} className="hover-lift rounded-2xl bg-white border border-red-100 p-5 will-change-transform">
              <p className="font-black text-gray-900 mb-2">{p.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
        ))}
      </div>

      {/* 비교 테이블 */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full min-w-[640px] text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-4 font-bold text-gray-500 bg-gray-50 w-32">구분</th>
              <th className="px-5 py-4 font-bold text-gray-500 bg-gray-50 text-center">기존 SNS<br /><span className="text-xs font-normal text-gray-400">(X, 카카오)</span></th>
              <th className="px-5 py-4 font-bold text-gray-500 bg-gray-50 text-center">일반 매칭플랫폼</th>
              <th className="px-5 py-4 font-bold text-white bg-gradient-to-r from-purple-600 to-blue-500 text-center rounded-t-xl">Party-Up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {rows.map((row) => (
              <tr key={row.category} className="hover:bg-gray-50/50">
                <td className="px-5 py-4 font-bold text-gray-700 bg-gray-50/50">{row.category}</td>
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {row.snsBad && <FiX size={14} className="text-red-400 shrink-0" />}
                    <span className={`text-xs ${row.snsBad ? 'text-gray-400' : 'text-gray-600'}`}>{row.sns}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {row.generalBad && <FiAlertTriangle size={13} className="text-amber-400 shrink-0" />}
                    <span className={`text-xs ${row.generalBad ? 'text-gray-400' : 'text-gray-600'}`}>{row.general}</span>
                  </div>
                </td>
                <td className="px-5 py-4 bg-purple-50/30">
                  <div className="flex items-center gap-1.5">
                    <FiCheck size={14} className="text-purple-500 shrink-0" />
                    <span className="text-xs font-semibold text-gray-800">{row.partyup}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
