import {
  Camera,
  FileText,
  PenLine,
  PlusCircle,
  RefreshCw,
  Upload,
} from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const createSteps = [
  {
    title: '홈에서 파티 생성하기를 누릅니다',
    description:
      '파티 생성하기 버튼을 누르면 AI 행동 기반 인증 페이지로 이동합니다.',
    icon: PlusCircle,
  },
  {
    title: '문제 풀기 시작을 누릅니다',
    description:
      '인증 방법과 촬영 전 확인 사항을 읽은 뒤 문제 풀기 시작 버튼을 누릅니다.',
    icon: FileText,
  },
  {
    title: '화면에 나온 5자리 문자를 종이에 적습니다',
    description: '예: XKGUC처럼 화면에 표시된 문자를 종이에 크게 적습니다.',
    icon: PenLine,
  },
  {
    title: '요구된 손 포즈와 함께 촬영합니다',
    description:
      '따봉 같은 손 포즈와 종이에 적은 문자가 한 장의 사진에 함께 보이도록 촬영합니다.',
    icon: Camera,
  },
  {
    title: '사진을 업로드하고 인증을 제출합니다',
    description:
      'JPG, PNG, WEBP 형식의 이미지를 업로드한 뒤 인증 제출하기 버튼을 누릅니다.',
    icon: Upload,
  },
  {
    title: '인증 후 파티 정보를 입력합니다',
    description:
      '인증에 성공하면 안내되는 파티 생성 화면에서 서비스명, 파티명, 인원, 금액, 정산 주기 등을 입력합니다.',
    icon: FileText,
  },
];

export default function CreatePartyManualSection() {
  return (
    <ManualSection
      id="create-party"
      number="06"
      title="파티 만드는 방법"
      description="파티를 만들기 전에는 안전한 이용을 위해 AI 행동 기반 인증을 먼저 진행합니다."
    >
      <InstructionSteps steps={createSteps} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-black text-slate-950">촬영할 때 지켜야 할 것</h3>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
            <li>• 종이에 문제 문자 5자리를 크게 적습니다.</li>
            <li>• 요구된 손 포즈가 사진에 함께 보이게 촬영합니다.</li>
            <li>
              • 주변의 책, 모니터, 키보드, 옷에 있는 글자가 같이 찍히지 않게
              합니다.
            </li>
            <li>• 가능하면 밝은 곳에서 빈 배경 위에 촬영합니다.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-black text-slate-950">문제를 바꾸고 싶을 때</h3>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm leading-6 text-slate-600">
              현재 문제를 수행하기 어렵다면 다른 문제 풀기 버튼을 눌러 새로운
              문자와 손 포즈 문제를 받을 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="파티 생성 정보 입력 화면에 대해" variant="info">
          현재 확인된 화면은 AI 인증 단계까지입니다. 인증 이후 실제 파티 정보
          입력 화면은 프로젝트 구현 상태에 따라 항목명이 다를 수 있습니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
