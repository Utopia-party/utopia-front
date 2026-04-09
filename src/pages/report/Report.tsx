import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';

export default function Report() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold text-blue-600">
                  Report Center
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  신고
                </h1>
                <p className="mt-2 text-sm leading-6 text-gray-500 md:text-base">
                  사용자, 파티, 채팅에 대한 신고를 접수하고 처리 상태를 확인할
                  수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-gray-500">접수 대기</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">12</p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-gray-500">처리 완료</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">38</p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-gray-500">기각</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">4</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <ReportForm />
          <ReportList />
        </div>
      </div>
    </div>
  );
}
