import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import ManualSection from './ManualSection';

const troubleshootingItems = [
  {
    question: '이미지 인증의 확인 버튼이 활성화되지 않아요.',
    answer:
      '제시된 동물과 같은 사진을 3개 모두 순서대로 선택했는지 확인하세요. 선택 수가 3/3이 되어야 확인 버튼이 활성화됩니다.',
  },
  {
    question: '파티 상세에서 참여 버튼이 보이지 않아요.',
    answer:
      '이미 참여 중인 파티이거나, 모집 마감/완료 상태일 수 있습니다. 파티 상세의 모집 상태와 현재 인원을 확인하세요.',
  },
  {
    question: 'AI 행동 기반 인증 사진이 통과되지 않아요.',
    answer:
      '문자 5자리가 선명한지, 요구된 손 포즈가 함께 보이는지, 주변에 다른 글자가 섞이지 않았는지 확인한 뒤 다시 촬영하세요. 밝은 곳에서 빈 배경에 촬영하면 인식률이 높아집니다.',
  },
  {
    question: '계좌 입금 후 바로 승인되지 않아요.',
    answer:
      '계좌 입금은 관리자 승인 방식입니다. 승인까지 시간이 걸릴 수 있으니 결제 내역의 상태를 확인하세요.',
  },
  {
    question: '신고 결과는 어디에서 확인하나요?',
    answer:
      '신고 페이지의 내 신고 목록 또는 마이페이지의 신고 내역에서 처리 상태를 확인할 수 있습니다.',
  },
  {
    question: '빠른매칭 신청이 되지 않아요.',
    answer:
      '이미 진행 중인 빠른매칭 요청이 있거나, 해당 서비스의 활성 파티에 이미 참여 중인 경우 신청할 수 없습니다. 기존 매칭 요청을 취소하거나 참여 중인 파티를 확인해 보세요.',
  },
  {
    question: '빠른매칭에서 파티를 찾지 못했다고 나와요.',
    answer:
      '현재 모집 중인 파티가 없거나 조건에 맞는 파티가 없는 상태입니다. 잠시 후 다시 시도하거나, 홈에서 직접 파티를 검색해 보세요.',
  },
  {
    question: '같은 상대에게 칭찬이 안 돼요.',
    answer:
      '동일한 상대에게는 30일에 1번만 칭찬할 수 있습니다. 30일이 지난 뒤 다시 칭찬해 주세요.',
  },
  {
    question: '신뢰도 점수가 갑자기 내려갔어요.',
    answer:
      '신뢰도 변화 내역(마이페이지 → 신뢰도 변화)에서 언제, 어떤 이유로 점수가 변동되었는지 확인할 수 있습니다. 노쇼, 결제 지연, 신고 처리 등으로 감점될 수 있습니다.',
  },
  {
    question: '계정이 정지되었는데 억울해요.',
    answer:
      '이의신청(매뉴얼 08-1)을 통해 관리자 재검토를 요청할 수 있습니다. 제재가 부당하다고 생각하는 이유를 구체적으로 작성해서 제출하면 관리자가 검토 후 결과를 알림으로 알려드립니다.',
  },
];

export default function TroubleshootingSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <ManualSection
      id="troubleshooting"
      number="14"
      title="문제 해결"
      description="이용 중 자주 발생할 수 있는 상황과 해결 방법입니다."
    >
      <div className="grid gap-3">
        {troubleshootingItems.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={item.question}
              className="rounded-3xl border border-slate-200 bg-slate-50"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              >
                <span className="font-black text-slate-950">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="border-t border-slate-200 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </ManualSection>
  );
}
