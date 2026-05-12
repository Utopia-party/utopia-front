import { useRef } from 'react';
import { FiCamera } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

// 9단계 처리 프로세스
const processSteps = [
  { step: '1', name: '이미지 업로드', desc: '사용자가 인증 이미지를 API로 업로드', io: 'UploadFile' },
  { step: '2', name: '입력 검증', desc: '빈 파일·디코딩 실패·최소 해상도(100px) 미달 여부 확인', io: 'content_size / image_size' },
  { step: '3', name: '이미지 리사이즈', desc: '최대 변 기준 2200px 초과 시 축소', io: 'resize_info' },
  { step: '4', name: '손 랜드마크 검출', desc: 'MediaPipe HandLandmarker로 손 위치와 21개 랜드마크 추출', io: 'hand_landmarker.task' },
  { step: '5', name: '포즈 feature 생성', desc: '손목 기준 상대 좌표로 63개 feature 생성', io: 'pose_features (63차원)' },
  { step: '6', name: '포즈 모델 추론', desc: 'RandomForestClassifier로 손 포즈 분류', io: 'pose_classifier.pkl' },
  { step: '7', name: 'OCR 전처리', desc: '확대·grayscale·sharpening·threshold 전처리 수행', io: 'OCR variants' },
  { step: '8', name: 'OCR 판독', desc: 'PaddleOCR로 5자리 영숫자 문자열 탐색. score 0.93 이상 즉시 채택.', io: 'detected_text' },
  { step: '9', name: '결과 반환', desc: '포즈·OCR 텍스트·신뢰도·디버깅 정보 반환', io: 'inspection JSON' },
];

// 포즈별 데이터 분포
const poseData = [
  { label: '손바닥', count: 415, pct: 36.34, color: 'bg-blue-400' },
  { label: '브이', count: 335, pct: 29.33, color: 'bg-violet-400' },
  { label: '주먹', count: 211, pct: 18.48, color: 'bg-pink-400' },
  { label: '따봉', count: 181, pct: 15.85, color: 'bg-amber-400' },
];

// Confusion Matrix (재현 학습 결과)
const confMatrix = [
  { actual: '주먹', 주먹: 43, 손바닥: 0, 브이: 0, 따봉: 0 },
  { actual: '손바닥', 주먹: 0, 손바닥: 83, 브이: 0, 따봉: 0 },
  { actual: '브이', 주먹: 0, 손바닥: 0, 브이: 67, 따봉: 0 },
  { actual: '따봉', 주먹: 1, 손바닥: 0, 브이: 0, 따봉: 35 },
];

// 추론 기준값
const thresholds = [
  { item: '포즈 신뢰도 기준', value: '0.60', desc: '낮으면 실패 처리' },
  { item: 'OCR 신뢰도 기준', value: '0.60', desc: '낮으면 low_confidence 표시' },
  { item: 'OCR 조기 성공 기준', value: '0.93', desc: '5자리 + score 0.93 이상 시 즉시 채택' },
  { item: '최소 손 영역 비율', value: '0.03', desc: '손 영역이 너무 작으면 실패' },
  { item: '최소 이미지 크기', value: '100px', desc: '가로 또는 세로 100px 미만 실패' },
  { item: '최대 이미지 변 길이', value: '2200px', desc: '초과 시 최대 변 기준 축소' },
];

export default function HandOCRSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="handocr" className="py-20 md:py-32 bg-white">
      {/* 헤더 */}
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6">
          <FiCamera /> HandOCR AI 학습 결과
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          손 포즈 + OCR 결합
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-500">
            이미지 기반 미션 인증 파이프라인
          </span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          MediaPipe 21개 랜드마크 → RandomForest 분류 → PaddleOCR 5자리 인증.
          검증 데이터 229건 기준 정확도 <strong className="text-gray-700">99.56%</strong>.
        </p>
      </div>

      {/* 핵심 수치 */}
      <div className="stagger-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {[
          { label: '학습 데이터', value: '1,142건', sub: 'hand_poses.csv', color: 'text-blue-600' },
          { label: '분류 포즈', value: '4종', sub: '주먹·손바닥·브이·따봉', color: 'text-violet-600' },
          { label: '입력 feature', value: '63차원', sub: '21 landmarks × x/y/z', color: 'text-indigo-600' },
          { label: '검증 정확도', value: '99.56%', sub: '229건 기준', color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="hover-lift rounded-2xl border border-gray-100 bg-white shadow-sm p-6 text-center will-change-transform">
            <p className={`text-3xl font-extrabold mb-1 ${s.color}`}>{s.value}</p>
            <p className="font-bold text-gray-900 text-sm mb-1">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 9단계 처리 프로세스 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-500 inline-block" />
          9단계 처리 프로세스
        </h3>
        <div className="timeline-group relative pl-8">
          <div className="timeline-line absolute left-3 top-2 bottom-2 w-0.5 bg-blue-200 rounded-full" />
          <div className="space-y-3">
            {processSteps.map((s) => (
              <div key={s.step} className="timeline-item relative">
                <div className="absolute -left-8 top-4 w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow flex items-center justify-center">
                  <span className="text-[9px] text-white font-black">{s.step}</span>
                </div>
                <div className="hover-lift rounded-2xl border border-gray-100 bg-white shadow-sm p-4 will-change-transform">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{s.name}</p>
                    <span className="md:ml-auto px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 text-[11px] font-mono">{s.io}</span>
                  </div>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 포즈 데이터 분포 + 모델 설정 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-500 inline-block" />
          포즈별 데이터 분포 (1,142건)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 바 차트 */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            {/* 통합 스택 바 */}
            <div className="flex rounded-lg overflow-hidden h-4 mb-5">
              {poseData.map((p) => (
                <div key={p.label} className={`${p.color} h-full`} style={{ width: `${p.pct}%` }} title={`${p.label} ${p.pct}%`} />
              ))}
            </div>
            <div className="space-y-3">
              {poseData.map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className={`shrink-0 w-3 h-3 rounded-full ${p.color}`} />
                  <span className="text-sm font-bold text-gray-900 w-14">{p.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`${p.color} h-full rounded-full`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 tabular-nums w-16 text-right">{p.count}건</span>
                  <span className="text-xs text-gray-400 tabular-nums w-12 text-right">{p.pct}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              손바닥·브이 샘플이 상대적으로 많아 class_weight="balanced" 적용
            </p>
          </div>

          {/* 모델 설정 */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p className="text-xs font-bold text-blue-500 mb-4">RandomForestClassifier 설정</p>
            <div className="space-y-3">
              {[
                { param: '모델', value: 'RandomForestClassifier' },
                { param: 'n_estimators', value: '300 (트리 개수)' },
                { param: 'max_depth', value: '제한 없음' },
                { param: 'min_samples_leaf', value: '1' },
                { param: 'class_weight', value: 'balanced' },
                { param: 'train / val 분리', value: '80% / 20% (stratify)' },
                { param: 'random_state', value: '42' },
              ].map((r) => (
                <div key={r.param} className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm font-bold text-gray-600">{r.param}</span>
                  <span className="text-sm font-mono text-gray-900">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix + 추론 기준값 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-500 inline-block" />
          재현 학습 결과 (검증 데이터 229건)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 overflow-x-auto">
            <p className="text-xs font-bold text-gray-400 mb-3">Confusion Matrix</p>
            <table className="w-full text-center text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-gray-400 font-bold text-xs">실제 \ 예측</th>
                  {['주먹', '손바닥', '브이', '따봉'].map((h) => (
                    <th key={h} className="px-2 py-1 font-bold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confMatrix.map((row) => (
                  <tr key={row.actual}>
                    <td className="px-2 py-2 font-bold text-gray-700">{row.actual}</td>
                    {(['주먹', '손바닥', '브이', '따봉'] as const).map((col) => {
                      const val = row[col];
                      const isDiag = col === row.actual;
                      const isWrong = !isDiag && val > 0;
                      return (
                        <td
                          key={col}
                          className={`px-2 py-2 font-bold tabular-nums rounded ${
                            isDiag ? 'bg-blue-100 text-blue-700' : isWrong ? 'bg-red-100 text-red-600' : 'text-gray-300'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-3">오분류 1건: 실제 따봉 → 주먹으로 예측</p>
          </div>

          {/* 포즈별 F1 */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 mb-4">포즈별 Precision / Recall / F1</p>
            <div className="space-y-3">
              {[
                { pose: '주먹', p: 0.9773, r: 1.0000, f1: 0.9885 },
                { pose: '손바닥', p: 1.0000, r: 1.0000, f1: 1.0000 },
                { pose: '브이', p: 1.0000, r: 1.0000, f1: 1.0000 },
                { pose: '따봉', p: 1.0000, r: 0.9722, f1: 0.9859 },
              ].map((row) => (
                <div key={row.pose} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700 w-12">{row.pose}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: `${row.f1 * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-blue-600 tabular-nums w-14 text-right">
                    {(row.f1 * 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-bold text-gray-600">Weighted Avg</span>
              <span className="text-sm font-extrabold text-emerald-600">99.56%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 추론 기준값 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-500 inline-block" />
          추론 기준값
        </h3>
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {thresholds.map((t) => (
            <div key={t.item} className="hover-lift rounded-2xl border border-gray-100 bg-white shadow-sm p-5 will-change-transform">
              <p className="text-xs font-bold text-blue-500 mb-2">{t.item}</p>
              <p className="text-2xl font-extrabold text-gray-900 mb-1">{t.value}</p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
