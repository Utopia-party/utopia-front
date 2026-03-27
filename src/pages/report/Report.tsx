import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';

export default function Report() {
  return (
    <div className=" bg-gray-50 p-4 md:p-8">
      {/* 헤더 영역 (선택사항) */}
      <div className="mx-auto mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">신고</h1>
        <p className="text-sm text-gray-500 mt-1">
          사용자/파티/채팅 신고 · 처리 상태 조회
        </p>
      </div>

      {/* 메인 컨텐츠 (좌우 분할) */}
      <div className="mx-auto flex flex-col lg:flex-row gap-6">
        <ReportForm />
        <ReportList />
      </div>
    </div>
  );
}
