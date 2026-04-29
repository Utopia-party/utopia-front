import {
  BookOpen,
  Briefcase,
  Headphones,
  Tv,
  type LucideIcon,
} from 'lucide-react';

export const STATUS_LABEL: Record<string, string> = {
  recruiting: '모집중',
  full: '마감',
  completed: '완료',
  canceled: '취소',
};

export const CATEGORY_COLOR: Record<string, string> = {
  OTT: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
  '교육/도서': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/80',
  '음악/멤버십': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
  '생산성/기타': 'bg-pink-50 text-pink-700 ring-1 ring-pink-200/80',
  기타: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
};

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  OTT: Tv,
  '교육/도서': BookOpen,
  '음악/멤버십': Headphones,
  '생산성/기타': Briefcase,
  기타: Briefcase,
};

export const CATEGORY_ICON_TONE: Record<string, string> = {
  OTT: 'bg-sky-50 text-sky-600 ring-sky-100',
  '교육/도서': 'bg-violet-50 text-violet-600 ring-violet-100',
  '음악/멤버십': 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  '생산성/기타': 'bg-amber-50 text-amber-600 ring-amber-100',
  기타: 'bg-slate-100 text-slate-600 ring-slate-200',
};
