import { useState } from 'react';
import { FiExternalLink, FiFileText } from 'react-icons/fi';

interface DocumentItem {
  id: number;
  title: string;
  href: string;
  previewUrl: string;
}

const documents: DocumentItem[] = [
  {
    id: 1,
    title: '기능정의서',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=726265260#gid=726265260',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=726265260&single=true&widget=false&headers=false',
  },
  {
    id: 2,
    title: '요구사항정의서',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=1794821063#gid=1794821063',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=1794821063&single=true&widget=false&headers=false',
  },
  {
    id: 3,
    title: 'WBS',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=1007572871#gid=1007572871',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=1007572871&single=true&widget=false&headers=false',
  },
  {
    id: 4,
    title: 'RDBMS',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=1785929889#gid=1785929889',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=1785929889&single=true&widget=false&headers=false',
  },
  {
    id: 5,
    title: 'RDBMS DB객체목록',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=391647635#gid=391647635',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=391647635&single=true&widget=false&headers=false',
  },
  {
    id: 6,
    title: '벡터DB',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=1809985217#gid=1809985217',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=1809985217&single=true&widget=false&headers=false',
  },
  {
    id: 7,
    title: 'API명세서',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=225532408#gid=225532408',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=225532408&single=true&widget=false&headers=false',
  },
  {
    id: 8,
    title: '네이밍규칙',
    href: 'https://docs.google.com/spreadsheets/d/1H7rBxJL1bWO7ztLttXf1yqI6oPel1nTo/edit?gid=1088307676#gid=1088307676',
    previewUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoX7pP6_sDfNSPRsIt0XdvFW416nC-nRxZBJjMb2fpjL3YoDdNZLRDrWnDhdh57A/pubhtml?gid=1088307676&single=true&widget=false&headers=false',
  },
];

export default function DocumentShowcaseSection() {
  const [activeId, setActiveId] = useState<number>(1);
  const active = documents.find((d) => d.id === activeId)!;

  return (
    <section id="documents" className="py-8 md:py-12 lg:py-24">
      {/* 헤더 */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6">
          작업 산출물
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          프로젝트 진행 과정과 결과물을
          <br className="md:hidden" /> 문서로 확인해보세요
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl leading-relaxed">
          기획, 설계, 데이터베이스, API 명세 등 주요 작업 문서를 한눈에 살펴보고
          필요한 경우 원본 문서로 바로 이동할 수 있습니다.
        </p>
      </div>

      {/* 탭 버튼 */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setActiveId(doc.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeId === doc.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <FiFileText className="shrink-0" />
            {doc.title}
          </button>
        ))}
      </div>

      {/* 프리뷰 영역 */}
      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="h-[70vh] min-h-[520px] bg-gray-50">
          <iframe
            key={active.id}
            src={active.previewUrl}
            title={active.title}
            className="w-full h-full"
            loading="lazy"
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">{active.title}</h3>
          <a
            href={active.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            원본 보기
            <FiExternalLink />
          </a>
        </div>
      </div>
    </section>
  );
}
