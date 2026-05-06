import { CheckCircle2, Eye, LogIn, MousePointerClick } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const loginSteps = [
  {
    title: '로그인 페이지로 이동합니다',
    description:
      '우측 상단 또는 로그인 버튼을 눌러 로그인 화면으로 이동합니다.',
    icon: LogIn,
  },
  {
    title: '이메일과 비밀번호를 입력합니다',
    description:
      '이메일 입력칸과 비밀번호 입력칸에 계정 정보를 입력합니다. 비밀번호 아이콘을 눌러 입력값을 확인할 수 있습니다.',
    icon: Eye,
  },
  {
    title: '이미지 인증을 완료합니다',
    description:
      '상단에 제시된 동물 이모티콘과 같은 동물 사진을 아래 이미지에서 순서대로 선택합니다.',
    icon: MousePointerClick,
    details: [
      '예: 코끼리 → 사자 → 토끼 순서가 제시되면 아래 사진에서도 같은 순서로 선택합니다.',
      '선택한 사진에는 번호가 표시됩니다.',
      '3개를 모두 선택하면 확인 버튼이 활성화됩니다.',
    ],
  },
  {
    title: '인증 완료 상태를 확인하고 로그인합니다',
    description:
      '로그인 화면에 인증 완료 표시가 보이면 로그인 버튼을 눌러 접속합니다.',
    icon: CheckCircle2,
  },
];

export default function LoginManualSection() {
  return (
    <ManualSection
      id="login"
      number="01"
      title="로그인하는 방법"
      description="Party-Up을 이용하려면 먼저 로그인과 이미지 인증을 완료해야 합니다."
    >
      <InstructionSteps steps={loginSteps} />

      <div className="mt-5">
        <ManualCallout title="로그인 버튼이 눌리지 않을 때" variant="warning">
          이미지 인증이 완료되지 않았거나 이메일/비밀번호 입력이 비어 있을 수
          있습니다. 인증 완료 표시가 보이는지 먼저 확인하세요.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
