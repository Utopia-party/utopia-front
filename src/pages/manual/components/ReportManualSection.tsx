import { FileUp, Flag, ListChecks, PenLine, UserSearch } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const reportSteps = [
  {
    title: '신고 메뉴로 이동합니다',
    description: '좌측 메뉴 또는 신고 페이지에서 신고 등록 영역을 확인합니다.',
    icon: Flag,
  },
  {
    title: '신고 대상 닉네임 또는 이메일을 입력합니다',
    description: '문제가 발생한 사용자의 닉네임 또는 이메일을 입력합니다.',
    icon: UserSearch,
  },
  {
    title: '신고 사유를 선택합니다',
    description:
      '사기/금전요구, 스팸/홍보, 욕설/비방 등 해당하는 사유를 선택합니다.',
    icon: ListChecks,
  },
  {
    title: '상세 내용을 작성합니다',
    description: '언제, 어떤 상황에서 문제가 발생했는지 구체적으로 작성합니다.',
    icon: PenLine,
  },
  {
    title: '증빙 자료를 첨부하고 제출합니다',
    description:
      '필요한 경우 이미지, PDF, txt 등의 증빙 파일을 첨부한 뒤 신고를 제출합니다.',
    icon: FileUp,
  },
];

export default function ReportManualSection() {
  return (
    <ManualSection
      id="report"
      number="10"
      title="신고하는 방법"
      description="사기, 금전요구, 스팸, 욕설 등 문제가 발생하면 신고센터에서 신고를 접수할 수 있습니다."
    >
      <InstructionSteps steps={reportSteps} />

      <div className="mt-5">
        <ManualCallout title="신고 후 확인할 것" variant="info">
          신고를 제출한 뒤에는 내 신고 목록 또는 마이페이지의 신고 내역에서
          처리, 기각 등 현재 상태를 확인할 수 있습니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
